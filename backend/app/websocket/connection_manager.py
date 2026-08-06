import uuid
from typing import List, Dict
# pyrefly: ignore [missing-import]
from fastapi import WebSocket
from app.core.logging import logger

class ConnectionManager:
    def __init__(self):
        # Maps hospital_id -> list of active WebSocket connections
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, hospital_id: uuid.UUID):
        await websocket.accept()
        if hospital_id not in self.active_connections:
            self.active_connections[hospital_id] = []
        self.active_connections[hospital_id].append(websocket)
        logger.info("WebSocket client connected", hospital_id=str(hospital_id), active_connections_count=len(self.active_connections[hospital_id]))

    def disconnect(self, websocket: WebSocket, hospital_id: uuid.UUID):
        if hospital_id in self.active_connections:
            if websocket in self.active_connections[hospital_id]:
                self.active_connections[hospital_id].remove(websocket)
            if not self.active_connections[hospital_id]:
                del self.active_connections[hospital_id]
        logger.info("WebSocket client disconnected", hospital_id=str(hospital_id))

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_hospital(self, hospital_id: uuid.UUID, message: dict):
        if hospital_id in self.active_connections:
            logger.info("Broadcasting WebSocket message", hospital_id=str(hospital_id), client_count=len(self.active_connections[hospital_id]))
            for connection in self.active_connections[hospital_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    # Connection might have died, clean it up silently
                    logger.debug("Failed to send WebSocket broadcast to a client, will prune on disconnect", error=str(e))
        else:
            logger.debug("No active WebSocket clients to broadcast to for hospital", hospital_id=str(hospital_id))

# Global manager instance
manager = ConnectionManager()
