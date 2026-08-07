import uuid
from datetime import datetime, timedelta
from typing import Optional, List
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.database.models import AIPrediction, Alert, Patient
from app.database.repositories.entities import AlertRepository, PatientRepository
from app.services.notification_service import NotificationService
from app.websocket.connection_manager import manager

class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.alert_repo = AlertRepository(db)
        self.patient_repo = PatientRepository(db)
        self.notification_service = NotificationService()

    async def process_prediction(self, prediction: AIPrediction) -> Optional[Alert]:
        """
        Evaluates an AI prediction, determines if an alert is warranted,
        and applies cooldown/deduplication checks before creating the alert.
        """
        risk_score = prediction.risk_score
        
        # 1. Determine alert type
        if risk_score >= 90:
            alert_type = "critical"
        elif risk_score >= 75:
            alert_type = "high"
        elif risk_score >= 50:
            alert_type = "medium"
        elif risk_score >= 25:
            alert_type = "low"
        else:
            # Risk score is below threshold, no alert triggered
            return None

        patient_id = prediction.patient_id
        hospital_id = prediction.hospital_id

        # 2. Check Cooldown / Deduplication
        # Avoid duplicate ACTIVE alerts of the same type for this patient
        active_alert = await self.alert_repo.get_latest_active_for_patient_type(patient_id, alert_type)
        if active_alert:
            logger.info(
                "Skipping alert generation: duplicate active alert exists", 
                patient_id=str(patient_id), 
                alert_type=alert_type
            )
            return None

        # Check cooldown period (5 minutes) for recently resolved/acknowledged alerts of the same type
        cooldown_limit = datetime.utcnow() - timedelta(minutes=5)
        # Query latest alert of this type to see if it occurred within the cooldown limit
        # pyrefly: ignore [missing-import]
        from sqlalchemy import select, and_, desc
        stmt = select(Alert).where(
            and_(
                Alert.patient_id == patient_id,
                Alert.alert_type == alert_type,
                Alert.created_at >= cooldown_limit
            )
        ).order_by(desc(Alert.created_at)).limit(1)
        result = await self.db.execute(stmt)
        recent_alert = result.scalars().first()
        if recent_alert:
            logger.info(
                "Skipping alert generation: within cooldown period", 
                patient_id=str(patient_id), 
                alert_type=alert_type,
                last_alert_time=recent_alert.created_at.isoformat()
            )
            return None

        # 3. Create the Alert
        message = self._get_alert_message(alert_type, risk_score)
        
        alert = Alert(
            hospital_id=hospital_id,
            patient_id=patient_id,
            prediction_id=prediction.prediction_id,
            alert_type=alert_type,
            message=message,
            status="pending"
        )
        
        created_alert = await self.alert_repo.create(alert)
        logger.info("New alert created", alert_id=str(created_alert.alert_id), alert_type=alert_type, risk_score=risk_score)

        # 4. Trigger Real-time WebSocket Broadcast
        patient = await self.patient_repo.get_by_id(patient_id)
        patient_name = patient.name if patient else "Unknown Patient"
        
        await manager.broadcast_to_hospital(
            hospital_id=hospital_id,
            message={
                "event": "new_alert",
                "data": {
                    "alert_id": str(created_alert.alert_id),
                    "patient_id": str(patient_id),
                    "patient_name": patient_name,
                    "alert_type": alert_type,
                    "message": message,
                    "risk_score": risk_score,
                    "created_at": created_alert.created_at.isoformat()
                }
            }
        )

        # 5. Send FCM Push Notification
        # For this demo/setup, we simulate notifying the assigned doctor/nurse
        if patient and (patient.assigned_doctor_id or patient.assigned_nurse_id):
            # In a production app, we would resolve device tokens for the doctor/nurse.
            # We trigger the FCM notification service using standard topic or mock token.
            token = f"hospital_topic_{hospital_id}"  # e.g. broadcast to hospital topic
            title = f"MedNova Alert: {alert_type.upper()} Risk detected"
            body = f"Patient {patient_name} in bed {patient.bed_number or 'N/A'} is at {alert_type} risk (Score: {risk_score}%)."
            await self.notification_service.send_push(
                token=token,
                title=title,
                body=body,
                data={
                    "alert_id": str(created_alert.alert_id),
                    "patient_id": str(patient_id),
                    "alert_type": alert_type
                }
            )

        return created_alert

    def _get_alert_message(self, alert_type: str, risk_score: int) -> str:
        if alert_type == "critical":
            return f"CRITICAL VENTILATOR WARNING: Patient risk is extremely high ({risk_score}%). Check breathing parameters immediately."
        elif alert_type == "high":
            return f"High ventilator warning: Patient risk index is high ({risk_score}%). Clinical attention recommended."
        elif alert_type == "medium":
            return f"Medium alert: Patient risk score is elevated ({risk_score}%). Monitor trend carefully."
        else:
            return f"Low alert: Patient risk score is slightly elevated ({risk_score}%)."

    async def acknowledge_alert(self, alert_id: uuid.UUID, user_id: uuid.UUID, hospital_id: uuid.UUID) -> Optional[Alert]:
        alert = await self.alert_repo.get_by_id(alert_id, hospital_id)
        if not alert:
            return None
        
        alert.status = "acknowledged"
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.utcnow()
        await self.db.flush()
        
        # Broadcast real-time update
        await manager.broadcast_to_hospital(
            hospital_id=hospital_id,
            message={
                "event": "alert_acknowledged",
                "data": {
                    "alert_id": str(alert_id),
                    "status": "acknowledged",
                    "acknowledged_by": str(user_id)
                }
            }
        )
        return alert

    async def resolve_alert(self, alert_id: uuid.UUID, hospital_id: uuid.UUID) -> Optional[Alert]:
        alert = await self.alert_repo.get_by_id(alert_id, hospital_id)
        if not alert:
            return None
        
        alert.status = "resolved"
        await self.db.flush()
        
        # Broadcast real-time update
        await manager.broadcast_to_hospital(
            hospital_id=hospital_id,
            message={
                "event": "alert_resolved",
                "data": {
                    "alert_id": str(alert_id),
                    "status": "resolved"
                }
            }
        )
        return alert
