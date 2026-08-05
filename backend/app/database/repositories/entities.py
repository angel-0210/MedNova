import uuid
from typing import List, Optional, Any
from datetime import datetime
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.repositories.base import BaseRepository
from app.database.models import (
    Hospital, Ward, User, Patient, Device, 
    DeviceAssignment, SensorReading, AIPrediction, 
    Alert, AlertEscalation, AuditLog
)

class HospitalRepository(BaseRepository[Hospital]):
    def __init__(self, db: AsyncSession):
        super().__init__(Hospital, db)
        
    async def get_by_code(self, code: str) -> Optional[Hospital]:
        stmt = select(Hospital).where(Hospital.hospital_code == code)
        result = await self.db.execute(stmt)
        return result.scalars().first()


class WardRepository(BaseRepository[Ward]):
    def __init__(self, db: AsyncSession):
        super().__init__(Ward, db)


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()


class PatientRepository(BaseRepository[Patient]):
    def __init__(self, db: AsyncSession):
        super().__init__(Patient, db)


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, db: AsyncSession):
        super().__init__(Device, db)

    async def get_by_mac(self, mac_address: str) -> Optional[Device]:
        stmt = select(Device).where(Device.mac_address == mac_address)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_connection_code(self, connection_code: str) -> Optional[Device]:
        stmt = select(Device).where(Device.connection_code == connection_code)
        result = await self.db.execute(stmt)
        return result.scalars().first()


class DeviceAssignmentRepository(BaseRepository[DeviceAssignment]):
    def __init__(self, db: AsyncSession):
        super().__init__(DeviceAssignment, db)

    async def get_active_by_device(self, device_id: uuid.UUID) -> Optional[DeviceAssignment]:
        stmt = select(DeviceAssignment).where(
            and_(
                DeviceAssignment.device_id == device_id,
                DeviceAssignment.is_active == True
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_active_by_patient(self, patient_id: uuid.UUID) -> Optional[DeviceAssignment]:
        stmt = select(DeviceAssignment).where(
            and_(
                DeviceAssignment.patient_id == patient_id,
                DeviceAssignment.is_active == True
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()


class SensorReadingRepository(BaseRepository[SensorReading]):
    def __init__(self, db: AsyncSession):
        super().__init__(SensorReading, db)

    async def get_latest_for_patient(self, patient_id: uuid.UUID) -> Optional[SensorReading]:
        stmt = select(SensorReading).where(SensorReading.patient_id == patient_id).order_by(desc(SensorReading.timestamp)).limit(1)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_historical(
        self, 
        patient_id: uuid.UUID, 
        start_time: datetime, 
        end_time: datetime,
        limit: int = 1000
    ) -> List[SensorReading]:
        stmt = select(SensorReading).where(
            and_(
                SensorReading.patient_id == patient_id,
                SensorReading.timestamp >= start_time,
                SensorReading.timestamp <= end_time
            )
        ).order_by(desc(SensorReading.timestamp)).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class AIPredictionRepository(BaseRepository[AIPrediction]):
    def __init__(self, db: AsyncSession):
        super().__init__(AIPrediction, db)

    async def get_latest_for_patient(self, patient_id: uuid.UUID) -> Optional[AIPrediction]:
        stmt = select(AIPrediction).where(AIPrediction.patient_id == patient_id).order_by(desc(AIPrediction.created_at)).limit(1)
        result = await self.db.execute(stmt)
        return result.scalars().first()


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: AsyncSession):
        super().__init__(Alert, db)

    async def get_active_alerts(self, hospital_id: uuid.UUID) -> List[Alert]:
        stmt = select(Alert).where(
            and_(
                Alert.hospital_id == hospital_id,
                Alert.status == "pending"
            )
        ).order_by(desc(Alert.created_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_active_for_patient_type(self, patient_id: uuid.UUID, alert_type: str) -> Optional[Alert]:
        stmt = select(Alert).where(
            and_(
                Alert.patient_id == patient_id,
                Alert.alert_type == alert_type,
                Alert.status == "pending"
            )
        ).order_by(desc(Alert.created_at)).limit(1)
        result = await self.db.execute(stmt)
        return result.scalars().first()


class AlertEscalationRepository(BaseRepository[AlertEscalation]):
    def __init__(self, db: AsyncSession):
        super().__init__(AlertEscalation, db)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)
