import uuid
from datetime import datetime
from typing import List
# pyrefly: ignore [missing-import]
from sqlalchemy import select, and_
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.database.models import Alert, AlertEscalation, User
from app.database.repositories.entities import AlertEscalationRepository, UserRepository
from app.services.notification_service import NotificationService

class EscalationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.escalation_repo = AlertEscalationRepository(db)
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService()

    async def check_and_escalate_alerts(self) -> int:
        """
        Scans all pending alerts and escalates them based on elapsed time:
        - 2 minutes -> Nurse (Level 1)
        - 5 minutes -> Doctor (Level 2)
        - 10 minutes -> Admin (Level 3)
        Returns the number of alerts escalated.
        """
        now = datetime.utcnow()
        
        # 1. Fetch pending alerts
        stmt = select(Alert).where(Alert.status == "pending")
        result = await self.db.execute(stmt)
        pending_alerts = result.scalars().all()
        
        escalated_count = 0
        
        for alert in pending_alerts:
            elapsed_seconds = (now - alert.created_at).total_seconds()
            elapsed_minutes = elapsed_seconds / 60.0
            
            # Fetch existing escalations for this alert
            esc_stmt = select(AlertEscalation).where(AlertEscalation.alert_id == alert.alert_id)
            esc_result = await self.db.execute(esc_stmt)
            existing_escalations = esc_result.scalars().all()
            escalated_levels = {e.escalation_level for e in existing_escalations}
            
            target_level = 0
            role_to_notify = None
            
            # Check thresholds
            if elapsed_minutes >= 10.0 and 3 not in escalated_levels:
                target_level = 3
                role_to_notify = "admin"
            elif elapsed_minutes >= 5.0 and 2 not in escalated_levels:
                target_level = 2
                role_to_notify = "doctor"
            elif elapsed_minutes >= 2.0 and 1 not in escalated_levels:
                target_level = 1
                role_to_notify = "nurse"
                
            if target_level > 0 and role_to_notify:
                # 2. Find users with that role in the hospital
                user_stmt = select(User).where(
                    and_(
                        User.hospital_id == alert.hospital_id,
                        User.role == role_to_notify,
                        User.is_active == True
                    )
                )
                user_result = await self.db.execute(user_stmt)
                users = user_result.scalars().all()
                
                if not users:
                    logger.warn(
                        "No active users found for escalation target role", 
                        hospital_id=str(alert.hospital_id), 
                        role=role_to_notify, 
                        alert_id=str(alert.alert_id)
                    )
                    continue
                
                # Escalating: record escalation for each matching user
                for user in users:
                    escalation = AlertEscalation(
                        hospital_id=alert.hospital_id,
                        alert_id=alert.alert_id,
                        notified_user_id=user.user_id,
                        escalation_level=target_level,
                        delivery_status="sent"
                    )
                    await self.escalation_repo.create(escalation)
                    
                    # 3. Dispatch Push Notification
                    token = f"user_token_{user.user_id}"  # In prod, fetch user device token
                    title = f"ESCALATION LEVEL {target_level}: {alert.alert_type.upper()} ALERT"
                    body = f"Alert for patient remained unacknowledged for {int(elapsed_minutes)} mins. Action required!"
                    await self.notification_service.send_push(
                        token=token,
                        title=title,
                        body=body,
                        data={
                            "alert_id": str(alert.alert_id),
                            "escalation_level": str(target_level)
                        }
                    )
                
                logger.info(
                    "Alert escalated", 
                    alert_id=str(alert.alert_id), 
                    level=target_level, 
                    notified_role=role_to_notify,
                    users_notified_count=len(users)
                )
                escalated_count += 1
                
        if escalated_count > 0:
            await self.db.flush()
            
        return escalated_count
