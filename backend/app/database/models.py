import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import Table, Column, String, Integer, Numeric, Boolean, DateTime, Date, ForeignKey, Text, BigInteger
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class Hospital(Base):
    __tablename__ = "hospitals"
    
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    hospital_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    wards: Mapped[List["Ward"]] = relationship(back_populates="hospital", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship(back_populates="hospital", cascade="all, delete-orphan")
    patients: Mapped[List["Patient"]] = relationship(back_populates="hospital", cascade="all, delete-orphan")
    devices: Mapped[List["Device"]] = relationship(back_populates="hospital", cascade="all, delete-orphan")


class Ward(Base):
    __tablename__ = "wards"

    ward_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    unit_type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital: Mapped["Hospital"] = relationship(back_populates="wards")
    patients: Mapped[List["Patient"]] = relationship(back_populates="ward")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)  # References auth.users(id)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[Optional[str]] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, nullable=False)  # admin, doctor, nurse, attendant
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital: Mapped["Hospital"] = relationship(back_populates="users")
    patients_as_doctor: Mapped[List["Patient"]] = relationship("Patient", foreign_keys="[Patient.assigned_doctor_id]", back_populates="assigned_doctor")
    patients_as_nurse: Mapped[List["Patient"]] = relationship("Patient", foreign_keys="[Patient.assigned_nurse_id]", back_populates="assigned_nurse")


class Patient(Base):
    __tablename__ = "patients"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    ward_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("wards.ward_id", ondelete="SET NULL"))
    bed_number: Mapped[Optional[str]] = mapped_column(String)
    name: Mapped[str] = mapped_column(String, nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String, nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, default=date.today)
    ventilator_status: Mapped[str] = mapped_column(String, nullable=False)  # active, weaning, off
    assigned_doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    assigned_nurse_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital: Mapped["Hospital"] = relationship(back_populates="patients")
    ward: Mapped[Optional["Ward"]] = relationship(back_populates="patients")
    assigned_doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_doctor_id], back_populates="patients_as_doctor")
    assigned_nurse: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_nurse_id], back_populates="patients_as_nurse")
    assignments: Mapped[List["DeviceAssignment"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    sensor_readings: Mapped[List["SensorReading"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    ai_predictions: Mapped[List["AIPrediction"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="patient", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    device_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    mac_address: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    firmware_version: Mapped[Optional[str]] = mapped_column(String)
    battery_level: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, nullable=False)  # online, offline, maintenance, error
    last_ping: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital: Mapped["Hospital"] = relationship(back_populates="devices")
    assignments: Mapped[List["DeviceAssignment"]] = relationship(back_populates="device")


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"

    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    device_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.device_id", ondelete="RESTRICT"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.patient_id", ondelete="RESTRICT"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    unassigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    device: Mapped["Device"] = relationship(back_populates="assignments")
    patient: Mapped["Patient"] = relationship(back_populates="assignments")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.device_id", ondelete="SET NULL"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    spo2: Mapped[Optional[float]] = mapped_column(Numeric)
    heart_rate: Mapped[Optional[float]] = mapped_column(Numeric)
    pressure: Mapped[Optional[float]] = mapped_column(Numeric)
    temperature: Mapped[Optional[float]] = mapped_column(Numeric)
    airflow: Mapped[Optional[float]] = mapped_column(Numeric)
    respiratory_rate: Mapped[Optional[float]] = mapped_column(Numeric)

    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="sensor_readings")


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    prediction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String, nullable=False)  # normal, low, medium, high, critical
    confidence: Mapped[float] = mapped_column(Numeric, nullable=False)
    recommendation: Mapped[Optional[str]] = mapped_column(Text)
    model_version: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="ai_predictions")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="prediction")


class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)
    prediction_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_predictions.prediction_id", ondelete="SET NULL"))
    alert_type: Mapped[str] = mapped_column(String, nullable=False)  # critical, high, medium, low, device
    message: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)  # pending, acknowledged, resolved
    acknowledged_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient: Mapped["Patient"] = relationship(back_populates="alerts")
    prediction: Mapped[Optional["AIPrediction"]] = relationship(back_populates="alerts")
    escalations: Mapped[List["AlertEscalation"]] = relationship(back_populates="alert", cascade="all, delete-orphan")


class AlertEscalation(Base):
    __tablename__ = "alert_escalations"

    escalation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.alert_id", ondelete="CASCADE"), nullable=False)
    notified_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    escalation_level: Mapped[int] = mapped_column(Integer, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    delivery_status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    alert: Mapped["Alert"] = relationship(back_populates="escalations")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    hospital_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_name: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
