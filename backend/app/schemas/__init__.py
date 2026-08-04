from app.schemas.auth import Token, TokenPayload, LoginRequest, RegisterRequest
from app.schemas.entities import (
    HospitalCreate, HospitalUpdate, HospitalResponse,
    WardCreate, WardUpdate, WardResponse,
    UserCreate, UserUpdate, UserResponse,
    PatientCreate, PatientUpdate, PatientResponse,
    DeviceCreate, DeviceUpdate, DeviceResponse,
    DeviceAssignmentCreate, DeviceAssignmentResponse,
    SensorReadingCreate, IotIngestPayload, SensorReadingResponse,
    AIPredictionResponse, AlertResponse, AuditLogResponse
)
