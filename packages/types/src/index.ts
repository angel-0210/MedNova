export type UserRole = 'admin' | 'doctor' | 'nurse' | 'attendant';

export interface User {
  user_id: string;
  hospital_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  department?: string;
  phone?: string;
  profile_picture?: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  hospital_id: string;
  name: string;
  hospital_code: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Ward {
  ward_id: string;
  hospital_id: string;
  name: string;
  unit_type: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  patient_id: string;
  hospital_id: string;
  ward_id?: string;
  bed_number?: string;
  name: string;
  age: number;
  gender: string;
  admission_date: string;
  ventilator_status: 'active' | 'weaning' | 'off';
  assigned_doctor_id?: string;
  assigned_nurse_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  device_id: string;
  hospital_id: string;
  mac_address: string;
  connection_code: string;
  firmware_version?: string;
  battery_level?: number;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  last_ping?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceAssignment {
  assignment_id: string;
  hospital_id: string;
  device_id: string;
  patient_id: string;
  assigned_at: string;
  unassigned_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  reading_id: number;
  hospital_id: string;
  patient_id: string;
  device_id?: string;
  timestamp: string;
  spo2: number;
  heart_rate: number;
  temperature: number;
}

/** Downloadable patient summary. `markdown` is the document the client saves to disk. */
export interface PatientReport {
  patient_id: string;
  patient_name: string;
  generated_at: string;
  /** Which engine wrote the prose: Gemini, or the deterministic fallback. */
  narrative_source: string;
  risk_level?: string;
  risk_score?: number;
  summary: string;
  next_steps: string[];
  disclaimer: string;
  markdown: string;
}

/** Clinician follow-up on an AI result. Mirrors the CHECK constraint on ai_predictions. */
export type FollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'not_required';

export interface AIPrediction {
  prediction_id: string;
  hospital_id: string;
  patient_id: string;
  risk_score: number;
  risk_level: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation?: string;
  model_version: string;
  follow_up_status: FollowUpStatus;
  clinician_note?: string;
  /** user_id of whoever last changed the follow-up. */
  follow_up_by?: string;
  follow_up_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  alert_id: string;
  hospital_id: string;
  patient_id: string;
  prediction_id?: string;
  alert_type: 'critical' | 'high' | 'medium' | 'low' | 'device';
  message: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertEscalation {
  escalation_id: string;
  hospital_id: string;
  alert_id: string;
  notified_user_id: string;
  escalation_level: number;
  sent_at: string;
  delivery_status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  log_id: number;
  hospital_id: string;
  user_id?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  ip_address?: string;
  created_at: string;
}

// Request and Response helper interfaces
export interface APIResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface Pagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

export interface Filters {
  search?: string;
  status?: string;
  role?: string;
  risk_level?: string;
  [key: string]: any;
}
