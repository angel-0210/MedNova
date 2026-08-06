import uuid
from datetime import datetime, date
from typing import Optional, List
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, EmailStr, field_validator
import re

# MAC Address pattern check helper
MAC_REGEX = re.compile(r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")

# =========================================================================
# HOSPITAL SCHEMAS
# =========================================================================
class HospitalBase(BaseModel):
    name: str = Field(..., min_length=1)
    hospital_code: str = Field(..., min_length=2)
    address: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    hospital_code: Optional[str] = None
    address: Optional[str] = None

class HospitalResponse(HospitalBase):
    hospital_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# WARD SCHEMAS
# =========================================================================
class WardBase(BaseModel):
    name: str = Field(..., min_length=1)
    unit_type: str = Field(..., min_length=1)

class WardCreate(WardBase):
    hospital_id: uuid.UUID

class WardUpdate(BaseModel):
    name: Optional[str] = None
    unit_type: Optional[str] = None

class WardResponse(WardBase):
    ward_id: uuid.UUID
    hospital_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# USER SCHEMAS
# =========================================================================
class UserBase(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    role: str = Field(..., pattern="^(admin|doctor|nurse|attendant)$")
    is_active: bool = True

class UserCreate(UserBase):
    hospital_id: uuid.UUID
    password_hash: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(admin|doctor|nurse|attendant)$")
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    user_id: uuid.UUID
    hospital_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# PATIENT SCHEMAS
# =========================================================================
class PatientBase(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., min_length=1)
    bed_number: Optional[str] = None
    ventilator_status: str = Field(..., pattern="^(active|weaning|off)$")
    assigned_doctor_id: Optional[uuid.UUID] = None
    assigned_nurse_id: Optional[uuid.UUID] = None
    ward_id: Optional[uuid.UUID] = None

class PatientCreate(PatientBase):
    hospital_id: uuid.UUID

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = None
    bed_number: Optional[str] = None
    ventilator_status: Optional[str] = Field(None, pattern="^(active|weaning|off)$")
    assigned_doctor_id: Optional[uuid.UUID] = None
    assigned_nurse_id: Optional[uuid.UUID] = None
    ward_id: Optional[uuid.UUID] = None

class PatientResponse(PatientBase):
    patient_id: uuid.UUID
    hospital_id: uuid.UUID
    admission_date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# DEVICE SCHEMAS
# =========================================================================
class DeviceBase(BaseModel):
    mac_address: str = Field(...)
    connection_code: str = Field(..., min_length=5, max_length=5, pattern="^[0-9]{5}$", description="5-digit precompiled device connection code")
    firmware_version: Optional[str] = None
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    status: str = Field(..., pattern="^(online|offline|maintenance|error)$")

    @field_validator("mac_address")
    @classmethod
    def validate_mac(cls, v: str) -> str:
        if not MAC_REGEX.match(v):
            raise ValueError("Invalid MAC Address format (e.g. AA:BB:CC:DD:EE:FF)")
        return v

class DeviceCreate(DeviceBase):
    hospital_id: uuid.UUID

class DeviceUpdate(BaseModel):
    firmware_version: Optional[str] = None
    battery_level: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(None, pattern="^(online|offline|maintenance|error)$")
    last_ping: Optional[datetime] = None

class DeviceResponse(DeviceBase):
    device_id: uuid.UUID
    hospital_id: uuid.UUID
    last_ping: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# DEVICE ASSIGNMENT SCHEMAS
# =========================================================================
class DeviceAssignmentBase(BaseModel):
    device_id: uuid.UUID
    patient_id: uuid.UUID

class DeviceAssignmentCreate(DeviceAssignmentBase):
    hospital_id: uuid.UUID

class DeviceAssignmentResponse(DeviceAssignmentBase):
    assignment_id: uuid.UUID
    hospital_id: uuid.UUID
    assigned_at: datetime
    unassigned_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# SENSOR READING SCHEMAS
# =========================================================================
class SensorReadingBase(BaseModel):
    spo2: float = Field(..., ge=0, le=100, description="Oxygen Saturation Percentage")
    heart_rate: float = Field(..., ge=0, le=300, description="Heart Rate in BPM")
    temperature: float = Field(..., ge=20, le=50, description="Patient Temperature in Celsius")

class SensorReadingCreate(SensorReadingBase):
    device_id: uuid.UUID
    patient_id: uuid.UUID
    hospital_id: uuid.UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class IotIngestPayload(SensorReadingBase):
    connection_code: str = Field(..., min_length=5, max_length=5, pattern="^[0-9]{5}$", description="5-digit precompiled device connection code")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SensorReadingResponse(SensorReadingBase):
    reading_id: int
    hospital_id: uuid.UUID
    patient_id: uuid.UUID
    device_id: Optional[uuid.UUID]
    timestamp: datetime

    class Config:
        from_attributes = True


# =========================================================================
# AI PREDICTION SCHEMAS
# =========================================================================
class AIPredictionResponse(BaseModel):
    prediction_id: uuid.UUID
    hospital_id: uuid.UUID
    patient_id: uuid.UUID
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str = Field(..., pattern="^(normal|low|medium|high|critical)$")
    confidence: float = Field(..., ge=0, le=1)
    recommendation: Optional[str]
    model_version: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "protected_namespaces": ()
    }


# =========================================================================
# ALERT SCHEMAS
# =========================================================================
class AlertResponse(BaseModel):
    alert_id: uuid.UUID
    hospital_id: uuid.UUID
    patient_id: uuid.UUID
    prediction_id: Optional[uuid.UUID]
    alert_type: str = Field(..., pattern="^(critical|high|medium|low|device)$")
    message: str
    status: str = Field(..., pattern="^(pending|acknowledged|resolved)$")
    acknowledged_by: Optional[uuid.UUID]
    acknowledged_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =========================================================================
# AUDIT LOG SCHEMAS
# =========================================================================
class AuditLogResponse(BaseModel):
    log_id: int
    hospital_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    entity_name: str
    entity_id: str
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
