# pyrefly: ignore [missing-import]
from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.iot import router as iot_router
from app.api.v1.endpoints.entities import (
    hospital_router, ward_router, user_router,
    patient_router, device_router, assignment_router,
    reading_router, prediction_router, alert_router,
    audit_router
)

api_router = APIRouter()

# Mount all endpoint routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(iot_router, prefix="/iot", tags=["IoT Ingestion"])
api_router.include_router(hospital_router, prefix="/hospitals", tags=["Hospitals"])
api_router.include_router(ward_router, prefix="/wards", tags=["Wards"])
api_router.include_router(user_router, prefix="/users", tags=["Users"])
api_router.include_router(patient_router, prefix="/patients", tags=["Patients"])
api_router.include_router(device_router, prefix="/devices", tags=["Devices"])
api_router.include_router(assignment_router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(reading_router, prefix="/readings", tags=["Sensor Readings"])
api_router.include_router(prediction_router, prefix="/predictions", tags=["AI Predictions"])
api_router.include_router(alert_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit Logs"])
