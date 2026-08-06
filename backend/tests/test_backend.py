# pyrefly: ignore [missing-import]
import pytest
import uuid
from datetime import datetime
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from httpx import AsyncClient
from unittest.mock import MagicMock, AsyncMock, patch

from app.main import app
from app.core.config import settings
from app.database.models import User, Hospital, Device, DeviceAssignment, SensorReading, AIPrediction, Alert
from app.core.security import get_current_user, verify_supabase_jwt
from app.database.session import get_db
from app.schemas.auth import TokenPayload

# Create a synchronous test client for basic health checks
client = TestClient(app)

def test_health_check():
    """
    Test that the health check endpoint returns 200 OK.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "MedNova" in response.json()["service"]


# Mocked authentication payload for testing
mock_user_id = uuid.uuid4()
mock_hospital_id = uuid.uuid4()

mock_payload = TokenPayload(
    sub=str(mock_user_id),
    email="test_doc@mednova.org",
    role="doctor",
    hospital_id=str(mock_hospital_id)
)

mock_db_user = User(
    user_id=mock_user_id,
    hospital_id=mock_hospital_id,
    name="Dr. Test",
    email="test_doc@mednova.org",
    role="doctor",
    is_active=True,
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow()
)

# FastAPI Dependency Overrides
async def override_verify_jwt():
    return mock_payload

async def override_get_current_user():
    return mock_db_user

# Mocked database session dependency
async def override_get_db():
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.flush = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.close = AsyncMock()
    yield mock_session


@pytest.mark.asyncio
async def test_auth_me_endpoint():
    """
    Tests that /api/v1/auth/me returns user profile info when authenticated.
    """
    # Apply overrides
    app.dependency_overrides[verify_supabase_jwt] = override_verify_jwt
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/me")
        
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dr. Test"
    assert data["role"] == "doctor"
    assert data["email"] == "test_doc@mednova.org"

    # Clean overrides
    app.dependency_overrides.clear()


@pytest.mark.asyncio
@patch("app.database.repositories.entities.DeviceRepository.get_by_connection_code")
@patch("app.database.repositories.entities.DeviceAssignmentRepository.get_active_by_device")
@patch("app.database.repositories.entities.SensorReadingRepository.create")
@patch("app.database.repositories.entities.AIPredictionRepository.create")
@patch("app.services.alert_service.AlertService.process_prediction")
@patch("app.websocket.connection_manager.ConnectionManager.broadcast_to_hospital")
async def test_iot_ingestion_pipeline(
    mock_broadcast,
    mock_process_alert,
    mock_create_prediction,
    mock_create_reading,
    mock_get_assignment,
    mock_get_device
):
    """
    Tests the complete IoT ingestion workflow under POST /api/v1/iot/readings.
    """
    # Overrides database session dependency
    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Mock responses
    device_id = uuid.uuid4()
    patient_id = uuid.uuid4()
    
    mock_device = Device(
        device_id=device_id,
        hospital_id=mock_hospital_id,
        mac_address="AA:BB:CC:DD:EE:FF",
        connection_code="58392",
        status="online"
    )
    mock_get_device.return_value = mock_device

    mock_assignment = DeviceAssignment(
        device_id=device_id,
        patient_id=patient_id,
        is_active=True
    )
    mock_get_assignment.return_value = mock_assignment

    mock_reading = SensorReading(
        reading_id=1,
        hospital_id=mock_hospital_id,
        patient_id=patient_id,
        device_id=device_id,
        timestamp=datetime.utcnow(),
        spo2=96.0,
        heart_rate=72.0,
        temperature=36.8
    )
    mock_create_reading.return_value = mock_reading
    mock_create_prediction.return_value = AIPrediction(prediction_id=uuid.uuid4(), risk_score=10, risk_level="normal")

    # 2. Call endpoint
    payload = {
        "connection_code": "58392",
        "timestamp": datetime.utcnow().isoformat(),
        "spo2": 96.0,
        "heart_rate": 72.0,
        "temperature": 36.8
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/iot/readings", json=payload)

    # 3. Asserts
    assert response.status_code == 201
    data = response.json()
    assert data["spo2"] == 96.0
    assert data["heart_rate"] == 72.0
    
    # Verify mock calls
    mock_get_device.assert_called_once_with("58392")
    mock_get_assignment.assert_called_once_with(device_id)
    mock_create_reading.assert_called_once()
    mock_create_prediction.assert_called_once()
    mock_process_alert.assert_called_once()
    mock_broadcast.assert_called_once()

    # Clean overrides
    app.dependency_overrides.clear()

