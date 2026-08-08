import uuid
from datetime import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, String
from app.core.logging import logger
from app.core.security import get_current_user, RequireRole
from app.database.session import get_db
from app.database.models import (
    User, Hospital, Ward, Patient, Device, 
    DeviceAssignment, SensorReading, AIPrediction, 
    Alert, AuditLog
)
from app.database.repositories.entities import (
    HospitalRepository, WardRepository, UserRepository,
    PatientRepository, DeviceRepository, DeviceAssignmentRepository,
    SensorReadingRepository, AIPredictionRepository, AlertRepository,
    AuditLogRepository
)
from app.api.v1.endpoints.auth import supabase_client
from app.schemas.entities import (
    HospitalCreate, HospitalUpdate, HospitalResponse,
    WardCreate, WardUpdate, WardResponse,
    UserUpdate, UserResponse, StaffCreate,
    PatientCreate, PatientUpdate, PatientResponse,
    DeviceCreate, DeviceUpdate, DeviceResponse,
    DeviceAssignmentCreate, DeviceAssignmentResponse,
    SensorReadingResponse, AIPredictionResponse, PredictionFollowUpUpdate,
    AlertResponse, AuditLogResponse
)
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService

# Define APIRouters
hospital_router = APIRouter()
ward_router = APIRouter()
user_router = APIRouter()
patient_router = APIRouter()
device_router = APIRouter()
assignment_router = APIRouter()
reading_router = APIRouter()
prediction_router = APIRouter()
alert_router = APIRouter()
audit_router = APIRouter()


# =========================================================================
# HOSPITALS ENDPOINTS (Admin Only)
# =========================================================================
@hospital_router.post("", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(
    payload: HospitalCreate,
    request: Request,
    current_user: User = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    hospital_repo = HospitalRepository(db)
    # Check duplicate code
    existing = await hospital_repo.get_by_code(payload.hospital_code)
    if existing:
        raise HTTPException(status_code=400, detail="Hospital code already exists")
    
    hospital = Hospital(**payload.model_dump())
    created = await hospital_repo.create(hospital)
    await db.flush()

    # Log Audit
    audit_service = AuditService(db)
    await audit_service.log_action(
        hospital_id=created.hospital_id,
        user_id=current_user.user_id,
        action="CREATE_HOSPITAL",
        entity_name="hospitals",
        entity_id=str(created.hospital_id),
        ip_address=request.client.host if request.client else None
    )
    return created

@hospital_router.get("/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(
    hospital_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce multi-tenancy. Admins are hospital-scoped too -- every other endpoint
    # filters by current_user.hospital_id, so exempting them here was a tenant leak.
    if current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this hospital's data")
        
    hospital_repo = HospitalRepository(db)
    hospital = await hospital_repo.get_by_id(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


# =========================================================================
# WARDS ENDPOINTS (All staff)
# =========================================================================
@ward_router.post("", response_model=WardResponse, status_code=status.HTTP_201_CREATED)
async def create_ward(
    payload: WardCreate,
    current_user: User = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Enforce multi-tenancy
    if current_user.hospital_id != payload.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital mismatch")
        
    ward_repo = WardRepository(db)
    ward = Ward(**payload.model_dump())
    created = await ward_repo.create(ward)
    await db.flush()
    return created

@ward_router.get("", response_model=List[WardResponse])
async def list_wards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ward_repo = WardRepository(db)
    return await ward_repo.list_all(hospital_id=current_user.hospital_id)


# =========================================================================
# USERS PROFILE ENDPOINTS (Staff access)
# =========================================================================
@user_router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreate,
    request: Request,
    current_user: User = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a staff member from the admin panel.

    Uses the service-role admin API with email_confirm=True rather than /auth/register's
    sign_up: a sign_up account stays unconfirmed and sign_in_with_password then fails, so
    admin-created staff could never actually log in.
    """
    user_repo = UserRepository(db)
    if await user_repo.get_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email is already registered")

    try:
        created_auth = supabase_client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "role": payload.role,
                "hospital_id": str(current_user.hospital_id),
                "name": payload.name,
            },
        })
    except Exception as e:
        logger.exception("Auth provider staff creation failed", email=payload.email, error=str(e))
        raise HTTPException(status_code=400, detail="Could not create staff account")

    if not created_auth.user:
        raise HTTPException(status_code=500, detail="Auth provider returned no user")

    auth_user_id = uuid.UUID(created_auth.user.id)
    try:
        created = await user_repo.create(User(
            user_id=auth_user_id,
            hospital_id=current_user.hospital_id,
            name=payload.name,
            email=payload.email,
            password_hash=None,  # Handled by Supabase Auth
            role=payload.role,
            is_active=True,
        ))
        await db.flush()

        audit_service = AuditService(db)
        await audit_service.log_action(
            hospital_id=current_user.hospital_id,
            user_id=current_user.user_id,
            action="CREATE_STAFF",
            entity_name="users",
            entity_id=str(created.user_id),
            ip_address=request.client.host if request.client else None
        )
        return created
    except Exception as e:
        # Same orphan-auth-user hazard /register guards against: without this the auth
        # account survives with no public.users row and every login dies on lookup.
        logger.exception("Staff profile creation failed, rolling back auth user", error=str(e))
        try:
            supabase_client.auth.admin.delete_user(str(auth_user_id))
        except Exception as cleanup_error:
            logger.error("Failed to roll back auth user", user_id=str(auth_user_id), error=str(cleanup_error))
        raise HTTPException(status_code=400, detail="Could not create staff account")

@user_router.get("", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    return await user_repo.list_all(hospital_id=current_user.hospital_id)

@user_router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id, hospital_id=current_user.hospital_id)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user

@user_router.patch("/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this profile")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id, hospital_id=current_user.hospital_id)
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, val)

    db.add(user)
    await db.flush()
    return user


# =========================================================================
# PATIENTS ENDPOINTS (Doctor / Nurse)
# =========================================================================
@patient_router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    if current_user.hospital_id != payload.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital ID mismatch")
        
    patient_repo = PatientRepository(db)
    patient = Patient(**payload.model_dump())
    created = await patient_repo.create(patient)
    await db.flush()
    return created

@patient_router.get("", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None),
    ventilator_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Patient).where(Patient.hospital_id == current_user.hospital_id)
    if ventilator_status:
        stmt = stmt.where(Patient.ventilator_status == ventilator_status)
    if search:
        search_lower = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Patient.name).like(search_lower) |
            func.lower(Patient.bed_number).like(search_lower) |
            func.cast(Patient.patient_id, String).like(search_lower)
        )
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@patient_router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient_repo = PatientRepository(db)
    patient = await patient_repo.get_by_id(patient_id, hospital_id=current_user.hospital_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@patient_router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    request: Request,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Edits patient details. PatientUpdate already existed and was imported but had no
    route, so the admin panel could create patients and never correct them.
    """
    patient_repo = PatientRepository(db)
    # Scope the lookup by hospital so one tenant cannot edit another's patient by id.
    patient = await patient_repo.get_by_id(patient_id, hospital_id=current_user.hospital_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    updated = await patient_repo.update(patient, payload)

    audit_service = AuditService(db)
    client_ip = request.client.host if request.client else "unknown"
    await audit_service.log_action(
        hospital_id=current_user.hospital_id,
        user_id=current_user.user_id,
        action="UPDATE_PATIENT",
        entity_name="patients",
        entity_id=str(patient_id),
        ip_address=client_ip
    )
    return updated


# =========================================================================
# DEVICES ENDPOINTS
# =========================================================================
@device_router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceCreate,
    current_user: User = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    if current_user.hospital_id != payload.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital ID mismatch")
        
    device_repo = DeviceRepository(db)
    existing = await device_repo.get_by_mac(payload.mac_address)
    if existing:
        raise HTTPException(status_code=400, detail="Device MAC Address already registered")
        
    device = Device(**payload.model_dump())
    created = await device_repo.create(device)
    await db.flush()
    return created

@device_router.get("", response_model=List[DeviceResponse])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    device_repo = DeviceRepository(db)
    return await device_repo.list_all(hospital_id=current_user.hospital_id)


# =========================================================================
# DEVICE ASSIGNMENTS ENDPOINTS
# =========================================================================
@assignment_router.post("", response_model=DeviceAssignmentResponse)
async def assign_device(
    payload: DeviceAssignmentCreate,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    if current_user.hospital_id != payload.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital ID mismatch")
        
    device_repo = DeviceRepository(db)
    patient_repo = PatientRepository(db)
    assignment_repo = DeviceAssignmentRepository(db)

    # Check device and patient exist and belong to the same hospital
    device = await device_repo.get_by_id(payload.device_id, hospital_id=payload.hospital_id)
    patient = await patient_repo.get_by_id(payload.patient_id, hospital_id=payload.hospital_id)
    if not device or not patient:
        raise HTTPException(status_code=404, detail="Device or Patient not found in this hospital")

    # Prevent multiple active assignments for the same device
    active_assignment = await assignment_repo.get_active_by_device(payload.device_id)
    if active_assignment:
        raise HTTPException(status_code=400, detail="This device is already actively assigned to another patient")

    assignment = DeviceAssignment(
        hospital_id=payload.hospital_id,
        device_id=payload.device_id,
        patient_id=payload.patient_id,
        is_active=True
    )
    created = await assignment_repo.create(assignment)
    await db.flush()
    return created

@assignment_router.get("", response_model=List[DeviceAssignmentResponse])
async def list_active_assignments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Active device<->patient links. Clients need these to resolve a device to the
    assignment_id that /unassign expects -- without it, unpairing has nothing to call.
    """
    assignment_repo = DeviceAssignmentRepository(db)
    return await assignment_repo.list_active(current_user.hospital_id)

@assignment_router.post("/{assignment_id}/unassign", response_model=DeviceAssignmentResponse)
async def remove_assignment(
    assignment_id: uuid.UUID,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    assignment_repo = DeviceAssignmentRepository(db)
    assignment = await assignment_repo.get_by_id(assignment_id, hospital_id=current_user.hospital_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment.is_active = False
    # pyrefly: ignore [deprecated]
    assignment.unassigned_at = datetime.utcnow()
    await db.flush()
    return assignment


# =========================================================================
# SENSOR READINGS ENDPOINTS
# =========================================================================
@reading_router.get("/patient/{patient_id}/latest", response_model=SensorReadingResponse)
async def get_latest_reading(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    reading_repo = SensorReadingRepository(db)
    patient_repo = PatientRepository(db)
    
    patient = await patient_repo.get_by_id(patient_id, hospital_id=current_user.hospital_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")
         
    reading = await reading_repo.get_latest_for_patient(patient_id)
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found for this patient")
    return reading

@reading_router.get("/patient/{patient_id}/historical", response_model=List[SensorReadingResponse])
async def get_historical_readings(
    patient_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    reading_repo = SensorReadingRepository(db)
    patient_repo = PatientRepository(db)
    
    patient = await patient_repo.get_by_id(patient_id, hospital_id=current_user.hospital_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")

    return await reading_repo.get_historical(patient_id, start_time, end_time, limit)


# =========================================================================
# AI PREDICTIONS ENDPOINTS
# =========================================================================
@prediction_router.get("/patient/{patient_id}/latest", response_model=AIPredictionResponse)
async def get_latest_prediction(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prediction_repo = AIPredictionRepository(db)
    patient_repo = PatientRepository(db)
    
    patient = await patient_repo.get_by_id(patient_id, hospital_id=current_user.hospital_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")

    prediction = await prediction_repo.get_latest_for_patient(patient_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="No predictions found for this patient")
    return prediction


@prediction_router.patch("/{prediction_id}/follow-up", response_model=AIPredictionResponse)
async def update_prediction_follow_up(
    prediction_id: uuid.UUID,
    payload: PredictionFollowUpUpdate,
    request: Request,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Records the clinician follow-up on an AI result: what is being done about it and
    a free-text note. Attendants are excluded -- this is a clinical decision record.
    """
    prediction_repo = AIPredictionRepository(db)
    prediction = await prediction_repo.get_by_id(prediction_id, hospital_id=current_user.hospital_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    if payload.follow_up_status is None and payload.clinician_note is None:
        raise HTTPException(status_code=400, detail="Provide follow_up_status, clinician_note, or both")

    if payload.follow_up_status is not None:
        prediction.follow_up_status = payload.follow_up_status
    if payload.clinician_note is not None:
        # An empty string is a deliberate "clear the note"; the generic repo update
        # skips falsy values, so this is set directly.
        prediction.clinician_note = payload.clinician_note or None

    # Stamp authorship every time, so the record always says who last touched it.
    prediction.follow_up_by = current_user.user_id
    prediction.follow_up_at = datetime.utcnow()
    await db.flush()

    audit_service = AuditService(db)
    client_ip = request.client.host if request.client else "unknown"
    await audit_service.log_action(
        hospital_id=current_user.hospital_id,
        user_id=current_user.user_id,
        action="UPDATE_PREDICTION_FOLLOW_UP",
        entity_name="ai_predictions",
        entity_id=str(prediction_id),
        ip_address=client_ip
    )
    return prediction


# =========================================================================
# ALERTS ENDPOINTS
# =========================================================================
@alert_router.get("/active", response_model=List[AlertResponse])
async def list_active_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    alert_repo = AlertRepository(db)
    return await alert_repo.get_active_alerts(hospital_id=current_user.hospital_id)

@alert_router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: uuid.UUID,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    alert_service = AlertService(db)
    alert = await alert_service.acknowledge_alert(alert_id, current_user.user_id, current_user.hospital_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@alert_router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: uuid.UUID,
    current_user: User = Depends(RequireRole(["admin", "doctor", "nurse"])),
    db: AsyncSession = Depends(get_db)
):
    alert_service = AlertService(db)
    alert = await alert_service.resolve_alert(alert_id, current_user.hospital_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# =========================================================================
# AUDIT LOGS ENDPOINTS (Admin Only)
# =========================================================================
@audit_router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    current_user: User = Depends(RequireRole(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    audit_repo = AuditLogRepository(db)
    return await audit_repo.list_recent(current_user.hospital_id)
