import uuid
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.database.models import AuditLog
from app.database.repositories.entities import AuditLogRepository

class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_repo = AuditLogRepository(db)

    async def log_action(
        self,
        hospital_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        action: str,
        entity_name: str,
        entity_id: str,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Inserts an audit log entry.
        """
        log = AuditLog(
            hospital_id=hospital_id,
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            ip_address=ip_address
        )
        
        created_log = await self.audit_repo.create(log)
        logger.info(
            "Audit log recorded", 
            hospital_id=str(hospital_id),
            user_id=str(user_id) if user_id else "system",
            action=action,
            entity=entity_name,
            entity_id=entity_id
        )
        return created_log
