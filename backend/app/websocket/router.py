import uuid
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
# pyrefly: ignore [missing-import, missing-source-for-stubs]
from jose import jwt
from app.core.config import settings
from app.core.logging import logger
from app.core.security import jwks_cache
from app.websocket.connection_manager import manager

router = APIRouter()

@router.websocket("/ws/dashboard")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # 1. Authenticate the WebSocket connection via query token
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            await websocket.close(code=1008, reason="Missing kid header")
            return
            
        key = await jwks_cache.get_key_by_kid(kid)
        if not key:
            await websocket.close(code=1008, reason="Invalid kid signature")
            return

        payload = jwt.decode(
            token,
            key,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE
        )
        
        hospital_id_str = payload.get("user_metadata", {}).get("hospital_id")
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
