-- =========================================================================
-- MedNova Database Schema Initialization
-- Production-Ready, Secure, Multi-Tenant Database
-- =========================================================================

-- Enable uuid-ossp extension for UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing schema elements if they exist (enables safe re-run)
DROP FUNCTION IF EXISTS public.prevent_update_delete_audit_logs() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_user_hospital_id() CASCADE;

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.alert_escalations CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.ai_predictions CASCADE;
DROP TABLE IF EXISTS public.sensor_readings CASCADE;
DROP TABLE IF EXISTS public.device_assignments CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.wards CASCADE;
DROP TABLE IF EXISTS public.hospitals CASCADE;

DROP DOMAIN IF EXISTS public.user_role CASCADE;
DROP DOMAIN IF EXISTS public.ventilator_status CASCADE;
DROP DOMAIN IF EXISTS public.device_status CASCADE;
DROP DOMAIN IF EXISTS public.risk_level CASCADE;
DROP DOMAIN IF EXISTS public.alert_type CASCADE;
DROP DOMAIN IF EXISTS public.alert_status CASCADE;

-- =========================================================================
-- 1. Custom Types / Domains
-- =========================================================================

CREATE DOMAIN public.user_role AS TEXT 
  CHECK (VALUE IN ('admin', 'doctor', 'nurse', 'attendant'));

CREATE DOMAIN public.ventilator_status AS TEXT 
  CHECK (VALUE IN ('active', 'weaning', 'off'));

CREATE DOMAIN public.device_status AS TEXT 
  CHECK (VALUE IN ('online', 'offline', 'maintenance', 'error'));

CREATE DOMAIN public.risk_level AS TEXT 
  CHECK (VALUE IN ('normal', 'low', 'medium', 'high', 'critical'));

CREATE DOMAIN public.alert_type AS TEXT 
  CHECK (VALUE IN ('critical', 'high', 'medium', 'low', 'device'));

CREATE DOMAIN public.alert_status AS TEXT 
  CHECK (VALUE IN ('pending', 'acknowledged', 'resolved'));


-- =========================================================================
-- 2. Tables Creation
-- =========================================================================

-- HOSPITALS
CREATE TABLE public.hospitals (
  hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hospital_code TEXT NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WARDS
CREATE TABLE public.wards (
  ward_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USERS
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role public.user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PATIENTS
CREATE TABLE public.patients (
  patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  ward_id UUID REFERENCES public.wards(ward_id) ON DELETE SET NULL,
  bed_number TEXT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 120),
  gender TEXT NOT NULL,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ventilator_status public.ventilator_status NOT NULL,
  assigned_doctor_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  assigned_nurse_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEVICES
CREATE TABLE public.devices (
  device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  mac_address TEXT NOT NULL UNIQUE,
  firmware_version TEXT,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  status public.device_status NOT NULL,
  last_ping TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEVICE ASSIGNMENTS (Temporal History Table)
CREATE TABLE public.device_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(device_id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SENSOR READINGS (High-Volume Table)
CREATE TABLE public.sensor_readings (
  reading_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(device_id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  spo2 NUMERIC CHECK (spo2 >= 0 AND spo2 <= 100),
  heart_rate NUMERIC CHECK (heart_rate >= 0 AND heart_rate <= 300),
  pressure NUMERIC CHECK (pressure >= -50 AND pressure <= 150),
  temperature NUMERIC CHECK (temperature >= 20 AND temperature <= 50),
  airflow NUMERIC CHECK (airflow >= 0 AND airflow <= 300),
  respiratory_rate NUMERIC CHECK (respiratory_rate >= 0 AND respiratory_rate <= 100)
);

-- AI PREDICTIONS
CREATE TABLE public.ai_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level public.risk_level NOT NULL,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  recommendation TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ALERTS
CREATE TABLE public.alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES public.ai_predictions(prediction_id) ON DELETE SET NULL,
  alert_type public.alert_type NOT NULL,
  message TEXT NOT NULL,
  status public.alert_status NOT NULL,
  acknowledged_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ALERT ESCALATIONS
CREATE TABLE public.alert_escalations (
  escalation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES public.alerts(alert_id) ON DELETE CASCADE,
  notified_user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUDIT LOGS (Append-only Table)
CREATE TABLE public.audit_logs (
  log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================================
-- 3. Indexes (Optimized for Querying and Joins)
-- =========================================================================

-- Wards
CREATE INDEX IF NOT EXISTS wards_hospital_id_idx ON public.wards (hospital_id);

-- Users
CREATE INDEX IF NOT EXISTS users_hospital_id_idx ON public.users (hospital_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

-- Patients
CREATE INDEX IF NOT EXISTS patients_hospital_id_idx ON public.patients (hospital_id);
CREATE INDEX IF NOT EXISTS patients_ward_id_idx ON public.patients (ward_id);
CREATE INDEX IF NOT EXISTS patients_assigned_doctor_id_idx ON public.patients (assigned_doctor_id);
CREATE INDEX IF NOT EXISTS patients_assigned_nurse_id_idx ON public.patients (assigned_nurse_id);

-- Devices
CREATE INDEX IF NOT EXISTS devices_hospital_id_idx ON public.devices (hospital_id);
CREATE INDEX IF NOT EXISTS devices_status_idx ON public.devices (status);

-- Device Assignments
CREATE INDEX IF NOT EXISTS device_assignments_hospital_id_idx ON public.device_assignments (hospital_id);
CREATE INDEX IF NOT EXISTS device_assignments_patient_id_idx ON public.device_assignments (patient_id);
CREATE INDEX IF NOT EXISTS device_assignments_device_id_idx ON public.device_assignments (device_id);
CREATE INDEX IF NOT EXISTS device_assignments_is_active_idx ON public.device_assignments (is_active);

-- UNIQUE partial index to prevent multiple active assignments for the same device
CREATE UNIQUE INDEX IF NOT EXISTS device_assignments_active_device_idx 
  ON public.device_assignments (device_id) 
  WHERE (is_active = TRUE);

-- Sensor Readings
CREATE INDEX IF NOT EXISTS sensor_readings_hospital_id_idx ON public.sensor_readings (hospital_id);
CREATE INDEX IF NOT EXISTS sensor_readings_patient_timestamp_idx ON public.sensor_readings (patient_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS sensor_readings_device_timestamp_idx ON public.sensor_readings (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS sensor_readings_timestamp_idx ON public.sensor_readings (timestamp DESC);

-- AI Predictions
CREATE INDEX IF NOT EXISTS ai_predictions_hospital_id_idx ON public.ai_predictions (hospital_id);
CREATE INDEX IF NOT EXISTS ai_predictions_patient_created_at_idx ON public.ai_predictions (patient_id, created_at DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS alerts_hospital_id_idx ON public.alerts (hospital_id);
CREATE INDEX IF NOT EXISTS alerts_patient_status_idx ON public.alerts (patient_id, status);
CREATE INDEX IF NOT EXISTS alerts_created_at_desc_idx ON public.alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS alerts_status_created_at_idx ON public.alerts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS alerts_prediction_id_idx ON public.alerts (prediction_id);
CREATE INDEX IF NOT EXISTS alerts_acknowledged_by_idx ON public.alerts (acknowledged_by);

-- Escalations
CREATE INDEX IF NOT EXISTS alert_escalations_hospital_id_idx ON public.alert_escalations (hospital_id);
CREATE INDEX IF NOT EXISTS alert_escalations_alert_id_idx ON public.alert_escalations (alert_id);
CREATE INDEX IF NOT EXISTS alert_escalations_notified_user_id_idx ON public.alert_escalations (notified_user_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS audit_logs_hospital_id_idx ON public.audit_logs (hospital_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_desc_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs (user_id);


-- =========================================================================
-- 4. Trigger Functions
-- =========================================================================

-- Automatically update updated_at timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER tr_hospitals_update_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_wards_update_updated_at BEFORE UPDATE ON public.wards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_users_update_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_patients_update_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_devices_update_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_device_assignments_update_updated_at BEFORE UPDATE ON public.device_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_ai_predictions_update_updated_at BEFORE UPDATE ON public.ai_predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_alerts_update_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_alert_escalations_update_updated_at BEFORE UPDATE ON public.alert_escalations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Prevent UPDATE or DELETE on Audit Logs helper
CREATE OR REPLACE FUNCTION public.prevent_update_delete_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only. Modification or deletion is strictly prohibited.';
END;
$$;

CREATE TRIGGER tr_audit_logs_prevent_update_delete
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_delete_audit_logs();


-- =========================================================================
-- 5. Row Level Security (RLS) Helper Functions and Policies
-- =========================================================================

-- Resolve current user's hospital_id securely using caching
CREATE OR REPLACE FUNCTION public.get_auth_user_hospital_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT hospital_id FROM public.users WHERE user_id = (SELECT auth.uid());
$$;

-- Secure the function execution
REVOKE EXECUTE ON FUNCTION public.get_auth_user_hospital_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_hospital_id() TO authenticated;

-- Enable RLS on all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Hospitals Policies
CREATE POLICY hospitals_policy ON public.hospitals
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.2 Wards Policies
CREATE POLICY wards_policy ON public.wards
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.3 Users Policies (Includes chicken-and-egg signup rule)
CREATE POLICY users_insert_policy ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY users_select_update_delete_policy ON public.users
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.4 Patients Policies
CREATE POLICY patients_policy ON public.patients
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.5 Devices Policies
CREATE POLICY devices_policy ON public.devices
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.6 Device Assignments Policies
CREATE POLICY device_assignments_policy ON public.device_assignments
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.7 Sensor Readings Policies
CREATE POLICY sensor_readings_policy ON public.sensor_readings
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.8 AI Predictions Policies
CREATE POLICY ai_predictions_policy ON public.ai_predictions
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.9 Alerts Policies
CREATE POLICY alerts_policy ON public.alerts
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.10 Alert Escalations Policies
CREATE POLICY alert_escalations_policy ON public.alert_escalations
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));

-- 5.11 Audit Logs Policies
CREATE POLICY audit_logs_select_policy ON public.audit_logs
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT public.get_auth_user_hospital_id()));

CREATE POLICY audit_logs_insert_policy ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = (SELECT public.get_auth_user_hospital_id()));
