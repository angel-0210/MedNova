import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.database.models import SensorReading, AIPrediction
from app.database.repositories.entities import (
    DeviceRepository, DeviceAssignmentRepository, 
    SensorReadingRepository, AIPredictionRepository
)
from app.schemas.entities import IotIngestPayload, SensorReadingResponse
from app.services.ai_service import AIService
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService
from app.websocket.connection_manager import manager
from app.core.logging import logger

router = APIRouter()

@router.post("/readings", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
async def ingest_readings(
    payload: IotIngestPayload,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest real-time IoT ventilator telemetry from ESP32.
    Triggers AI evaluation, alert check, notification push, real-time broadcast, and audit logging.
    """
    device_repo = DeviceRepository(db)
    assignment_repo = DeviceAssignmentRepository(db)
    reading_repo = SensorReadingRepository(db)
    prediction_repo = AIPredictionRepository(db)
    
    # 1. Verify Device
    device = await device_repo.get_by_connection_code(payload.connection_code)
    if not device:
        logger.warn("Telemetry ingestion rejected: Device with connection code not registered", connection_code=payload.connection_code)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with connection code {payload.connection_code} not registered"
        )
        
    if device.status == "maintenance":
        logger.info("Telemetry received for device under maintenance", device_id=str(device.device_id))

    # Update device last ping and status
    device.last_ping = payload.timestamp
    if device.status == "offline":
        device.status = "online"
    await db.flush()

    # 2. Find Active Patient Assignment
    assignment = await assignment_repo.get_active_by_device(device.device_id)
    if not assignment:
        logger.warn("Telemetry ingestion rejected: No active patient assignment", device_id=str(device.device_id))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device with connection code {payload.connection_code} is not currently assigned to any active patient"
        )

    # 3. Store Sensor Reading
    reading = SensorReading(
        hospital_id=device.hospital_id,
        patient_id=assignment.patient_id,
        device_id=device.device_id,
        timestamp=payload.timestamp,
        spo2=payload.spo2,
        heart_rate=payload.heart_rate,
        pressure=payload.pressure,
        temperature=payload.temperature,
        airflow=payload.airflow,
        respiratory_rate=payload.respiratory_rate
    )
    
    saved_reading = await reading_repo.create(reading)
    await db.flush()

    # 4. Run AI Service for Risk Prediction
    ai_service = AIService()
    risk_score, confidence, recommendation, model_version = await ai_service.predict_risk(saved_reading)
    
    # 5. Store AI Prediction
    prediction = AIPrediction(
        hospital_id=device.hospital_id,
        patient_id=assignment.patient_id,
        risk_score=risk_score,
        risk_level="critical" if risk_score >= 90 else "high" if risk_score >= 75 else "medium" if risk_score >= 50 else "low" if risk_score >= 25 else "normal",
        confidence=confidence,
        recommendation=recommendation,
        model_version=model_version
    )
    saved_prediction = await prediction_repo.create(prediction)
    await db.flush()

    # 6. Process Alert Logic (Generates Alert and triggers notifications if thresholds met)
    alert_service = AlertService(db)
    await alert_service.process_prediction(saved_prediction)

    # 7. Broadcast Telemetry to Hospital Dashboard via WebSockets
    await manager.broadcast_to_hospital(
        hospital_id=device.hospital_id,
        message={
            "event": "new_telemetry",
            "data": {
                "reading_id": saved_reading.reading_id,
                "patient_id": str(assignment.patient_id),
                "device_id": str(device.device_id),
                "timestamp": saved_reading.timestamp.isoformat(),
                "spo2": float(saved_reading.spo2),
                "heart_rate": float(saved_reading.heart_rate),
                "pressure": float(saved_reading.pressure),
                "temperature": float(saved_reading.temperature),
                "airflow": float(saved_reading.airflow),
                "respiratory_rate": float(saved_reading.respiratory_rate),
                "prediction": {
                    "risk_score": risk_score,
                    "risk_level": saved_prediction.risk_level,
                    "recommendation": recommendation
                }
            }
        }
    )

    # 8. Record Audit Log for Telemetry Ingestion
    audit_service = AuditService(db)
    client_ip = request.client.host if request.client else "unknown"
    await audit_service.log_action(
        hospital_id=device.hospital_id,
        user_id=None,  # Logged by device/system
        action="INGEST_TELEMETRY",
        entity_name="sensor_readings",
        entity_id=str(saved_reading.reading_id),
        ip_address=client_ip
    )

    return saved_reading
