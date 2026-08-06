from abc import ABC, abstractmethod
import os
import json
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

class BaseNotificationProvider(ABC):
    @abstractmethod
    async def send_notification(
        self, 
        token: str, 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Sends a push notification to a device token.
        """
        pass


class FCMNotificationProvider(BaseNotificationProvider):
    def __init__(self):
        self.initialized = False
        self.project_id = settings.FCM_PROJECT_ID
        
        credentials_path = settings.FCM_CREDENTIALS_PATH
        if credentials_path and os.path.exists(credentials_path):
            try:
                # pyrefly: ignore [missing-import]
                import firebase_admin
                # pyrefly: ignore [missing-import]
                from firebase_admin import credentials
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
                self.initialized = True
                logger.info("Firebase Admin SDK initialized successfully.")
            except Exception as e:
                logger.exception("Failed to initialize Firebase Admin SDK, using mock notification dispatcher", error=str(e))
        else:
            logger.info("Firebase credentials path not configured or file not found. Notification dispatcher running in MOCK mode.")

    async def send_notification(
        self, 
        token: str, 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        if self.initialized:
            try:
                # pyrefly: ignore [missing-import]
                from firebase_admin import messaging
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    data=data or {},
                    token=token,
                )
                response = messaging.send(message)
                logger.info("FCM push notification sent successfully", response_id=response, title=title)
                return True
            except Exception as e:
                logger.error("Failed to send FCM push notification", error=str(e), token=token)
                return False
        else:
            # Simulated notification (useful for development and test execution)
            logger.info(
                "NOTIFICATION SIMULATOR", 
                token=token[:10] + "...", 
                title=title, 
                body=body, 
                payload=json.dumps(data)
            )
            return True


class NotificationService:
    def __init__(self, provider: Optional[BaseNotificationProvider] = None):
        self.provider = provider or FCMNotificationProvider()

    async def send_push(
        self, 
        token: str, 
        title: str, 
        body: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        return await self.provider.send_notification(token, title, body, data)

    # pyrefly: ignore [bad-function-definition]
    async def broadcast_alert(self, user_tokens: list[str], title: str, body: str, data: dict = None):
        logger.info("Broadcasting push notifications to user tokens", count=len(user_tokens))
        success_count = 0
        for token in user_tokens:
            success = await self.send_push(token, title, body, data)
            if success:
                success_count += 1
        logger.info("Push notification broadcast completed", sent=success_count, total=len(user_tokens))
