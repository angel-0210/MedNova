import uuid
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.logging import logger
from app.core.security import decode_supabase_token
from app.websocket.connection_manager import manager

router = APIRouter()

@router.websocket("/ws/dashboard")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # 1. Authenticate the WebSocket connection via query token
    try:
        payload = await decode_supabase_token(token)

        hospital_id_str = payload.hospital_id
        if not hospital_id_str:
            await websocket.close(code=1008, reason="Missing hospital affiliation")
            return
            
        hospital_id = uuid.UUID(hospital_id_str)
    except Exception as e:
        logger.warn("WebSocket authentication failed", error=str(e))
        await websocket.close(code=1008, reason="Invalid authentication token")
        return

    # 2. Join the hospital room
    await manager.connect(websocket, hospital_id)
    try:
        # Keep-alive receive loop
        while True:
            # We don't expect client data, but we listen for disconnects or client pings
            data = await websocket.receive_text()
            # If client sends a ping, reply with pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, hospital_id)
    except Exception as e:
        logger.exception("WebSocket error occurred", error=str(e))
        manager.disconnect(websocket, hospital_id)


@router.websocket("/ws/patient/{patient_id}")
async def patient_websocket_endpoint(
    websocket: WebSocket,
    patient_id: uuid.UUID,
    token: str = Query(...)
):
    # 1. Authenticate the WebSocket connection via query token
    try:
        payload = await decode_supabase_token(token)
        hospital_id_str = payload.hospital_id
        if not hospital_id_str:
            await websocket.close(code=1008, reason="Missing hospital affiliation")
            return
    except Exception as e:
        logger.warn("WebSocket patient authentication failed", error=str(e))
        await websocket.close(code=1008, reason="Invalid authentication token")
        return

    # 2. Join the patient room
    await manager.connect_patient(websocket, patient_id)
    try:
        # Keep-alive receive loop
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_patient(websocket, patient_id)
    except Exception as e:
        logger.exception("WebSocket patient error occurred", error=str(e))
        manager.disconnect_patient(websocket, patient_id)

