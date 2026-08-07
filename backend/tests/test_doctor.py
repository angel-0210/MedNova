import pytest
import uuid
from datetime import datetime
from fastapi.testclient import TestClient
from httpx import AsyncClient
from unittest.mock import MagicMock, AsyncMock, patch

from app.main import app
from app.core.config import settings
from app.database.models import User, Hospital, Patient, Alert, AIPrediction, Report
from app.core.security import get_current_user, verify_supabase_jwt
from app.database.session import get_db
from app.schemas.auth import TokenPayload

# Mock values
mock_user_id = uuid.uuid4()
mock_hospital_id = uuid.uuid4()

mock_payload = TokenPayload(
    sub=str(mock_user_id),
    email="doctor@mednova.io",
    role="doctor",
    hospital_id=str(mock_hospital_id)
)

mock_db_user = User(
    user_id=mock_user_id,
    hospital_id=mock_hospital_id,
    name="Dr Test",
    email="doctor@mednova.io",
    role="doctor",
    is_active=True
)

async def override_verify_jwt():
    return mock_payload

async def override_get_current_user():
    return mock_db_user

# Setup simple mocked database dependencies
@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.execute = AsyncMock()
    session.scalar = AsyncMock()
    session.scalars = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    return session

@pytest.mark.asyncio
async def test_doctor_dashboard_endpoint(mock_db):
    """
    Tests that GET /api/v1/doctor/dashboard returns all summarized statistics.
    """
    async def override_db():
        yield mock_db

    app.dependency_overrides[verify_supabase_jwt] = override_verify_jwt
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_db

    # Mock DB counts & scalars
    mock_db.scalar.side_effect = [
        10,  # total patients
        2,   # pending alerts
        5,   # ack alerts
        3,   # online devices
        65.5,# avg risk score
        1    # critical cases count
    ]

    # Mock feed executes
    mock_alerts_res = MagicMock()
    mock_alerts_res.scalars.return_value.all.return_value = []
    mock_preds_res = MagicMock()
    mock_preds_res.scalars.return_value.all.return_value = []
    mock_reps_res = MagicMock()
    mock_reps_res.scalars.return_value.all.return_value = []
    
    mock_db.execute.side_effect = [
        mock_alerts_res,
        mock_preds_res,
        mock_reps_res
    ]

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/doctor/dashboard")
        
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert data["stats"]["total_patients"] == 10
    assert data["stats"]["pending_alerts"] == 2
    assert data["stats"]["average_risk_score"] == 65.5
    assert data["stats"]["online_devices"] == 3
    assert len(data["recent_alerts"]) == 0

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_doctor_patients_list(mock_db):
    """
    Tests listing ICU patients in GET /api/v1/doctor/patients.
    """
    async def override_db():
        yield mock_db
    app.dependency_overrides[verify_supabase_jwt] = override_verify_jwt
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_db

    mock_patients = [
        Patient(patient_id=uuid.uuid4(), hospital_id=mock_hospital_id, name="Patient A", bed_number="101", age=45, gender="male", ventilator_status="active"),
        Patient(patient_id=uuid.uuid4(), hospital_id=mock_hospital_id, name="Patient B", bed_number="102", age=62, gender="female", ventilator_status="weaning")
    ]
    
    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = mock_patients
    mock_db.execute.return_value = mock_res

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/doctor/patients")
        
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Patient A"
    assert data[1]["name"] == "Patient B"

    app.dependency_overrides.clear()
