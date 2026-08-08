import { apiClient } from './client.js';
import {
  User, UserRole, Patient, SensorReading, AIPrediction, FollowUpStatus,
  Alert, Device, DeviceAssignment, Hospital, Ward, AuditLog
} from '@mednova/types';

export const authRepository = {
  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },
};

export const hospitalRepository = {
  async getHospital(hospitalId: string): Promise<Hospital> {
    const response = await apiClient.get(`/api/v1/hospitals/${hospitalId}`);
    return response.data;
  },

  async createHospital(payload: { name: string; hospital_code: string; address?: string }): Promise<Hospital> {
    const response = await apiClient.post('/api/v1/hospitals', payload);
    return response.data;
  },
};

export const wardRepository = {
  async listWards(): Promise<Ward[]> {
    const response = await apiClient.get('/api/v1/wards');
    return response.data;
  },

  async createWard(payload: { name: string; unit_type: string; hospital_id: string }): Promise<Ward> {
    const response = await apiClient.post('/api/v1/wards', payload);
    return response.data;
  },
};

export const userRepository = {
  async listUsers(): Promise<User[]> {
    const response = await apiClient.get('/api/v1/users');
    return response.data;
  },

  async createStaff(payload: { name: string; email: string; password: string; role: UserRole }): Promise<User> {
    const response = await apiClient.post('/api/v1/users', payload);
    return response.data;
  },

  async getProfile(userId: string): Promise<User> {
    const response = await apiClient.get(`/api/v1/users/${userId}`);
    return response.data;
  },

  async updateProfile(userId: string, payload: Partial<User>): Promise<User> {
    const response = await apiClient.patch(`/api/v1/users/${userId}`, payload);
    return response.data;
  },
};

export const auditRepository = {
  async listLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get('/api/v1/audit/logs');
    return response.data;
  },
};

export const patientRepository = {
  async listPatients(params?: { search?: string; ventilator_status?: string; skip?: number; limit?: number }): Promise<Patient[]> {
    const response = await apiClient.get('/api/v1/patients', { params });
    return response.data;
  },

  async getPatient(patientId: string): Promise<Patient> {
    const response = await apiClient.get(`/api/v1/patients/${patientId}`);
    return response.data;
  },

  async createPatient(payload: Omit<Patient, 'patient_id' | 'admission_date' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const response = await apiClient.post('/api/v1/patients', payload);
    return response.data;
  },

  /** PATCH semantics: omitted keys are left untouched by the server. */
  async updatePatient(patientId: string, payload: Partial<Pick<Patient,
    'name' | 'age' | 'gender' | 'bed_number' | 'ventilator_status' |
    'assigned_doctor_id' | 'assigned_nurse_id' | 'ward_id'>>): Promise<Patient> {
    const response = await apiClient.patch(`/api/v1/patients/${patientId}`, payload);
    return response.data;
  },
};

export const vitalsRepository = {
  async getLatestReading(patientId: string): Promise<SensorReading> {
    const response = await apiClient.get(`/api/v1/readings/patient/${patientId}/latest`);
    return response.data;
  },

  async getHistoricalReadings(patientId: string, startTime: string, endTime: string, limit: number = 100): Promise<SensorReading[]> {
    const response = await apiClient.get(`/api/v1/readings/patient/${patientId}/historical`, {
      params: { start_time: startTime, end_time: endTime, limit },
    });
    return response.data;
  },
};

export const alertRepository = {
  async listActiveAlerts(): Promise<Alert[]> {
    const response = await apiClient.get('/api/v1/alerts/active');
    return response.data;
  },

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    const response = await apiClient.post(`/api/v1/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  async resolveAlert(alertId: string): Promise<Alert> {
    const response = await apiClient.post(`/api/v1/alerts/${alertId}/resolve`);
    return response.data;
  },
};

export const aiRepository = {
  async getLatestPrediction(patientId: string): Promise<AIPrediction> {
    const response = await apiClient.get(`/api/v1/predictions/patient/${patientId}/latest`);
    return response.data;
  },

  /** Records the clinician follow-up on a result. Send either field, or both. */
  async updateFollowUp(
    predictionId: string,
    payload: { follow_up_status?: FollowUpStatus; clinician_note?: string }
  ): Promise<AIPrediction> {
    const response = await apiClient.patch(`/api/v1/predictions/${predictionId}/follow-up`, payload);
    return response.data;
  },
};

export const deviceRepository = {
  async listDevices(): Promise<Device[]> {
    const response = await apiClient.get('/api/v1/devices');
    return response.data;
  },

  async registerDevice(payload: Omit<Device, 'device_id' | 'created_at' | 'updated_at'>): Promise<Device> {
    const response = await apiClient.post('/api/v1/devices', payload);
    return response.data;
  },

  async assignDevice(payload: { device_id: string; patient_id: string; hospital_id: string }): Promise<DeviceAssignment> {
    const response = await apiClient.post('/api/v1/assignments', payload);
    return response.data;
  },

  // Active device<->patient links. Callers need these to turn a device_id into the
  // assignment_id that unassignDevice expects.
  async listAssignments(): Promise<DeviceAssignment[]> {
    const response = await apiClient.get('/api/v1/assignments');
    return response.data;
  },

  async unassignDevice(assignmentId: string): Promise<DeviceAssignment> {
    const response = await apiClient.post(`/api/v1/assignments/${assignmentId}/unassign`);
    return response.data;
  },
};

export const doctorRepository = {
  async getDashboard(): Promise<any> {
    const response = await apiClient.get('/api/v1/doctor/dashboard');
    return response.data;
  },

  async listPatients(params?: { search?: string; ventilator_status?: string; skip?: number; limit?: number }): Promise<Patient[]> {
    const response = await apiClient.get('/api/v1/doctor/patients', { params });
    return response.data;
  },

  async getPatient(patientId: string): Promise<Patient> {
    const response = await apiClient.get(`/api/v1/doctor/patients/${patientId}`);
    return response.data;
  },

  async getPatientTimeline(patientId: string): Promise<any[]> {
    const response = await apiClient.get(`/api/v1/doctor/patients/${patientId}/timeline`);
    return response.data;
  },

  async addPatientNote(patientId: string, noteText: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/doctor/patients/${patientId}/notes`, { note_text: noteText });
    return response.data;
  },


  async listAlerts(params?: { alert_type?: string; status?: string }): Promise<Alert[]> {
    const response = await apiClient.get('/api/v1/doctor/alerts', { params });
    return response.data;
  },

  async getAlert(alertId: string): Promise<Alert> {
    const response = await apiClient.get(`/api/v1/doctor/alerts/${alertId}`);
    return response.data;
  },

  async acknowledgeAlert(alertId: string): Promise<Alert> {
    const response = await apiClient.patch(`/api/v1/doctor/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  async resolveAlert(alertId: string): Promise<Alert> {
    const response = await apiClient.patch(`/api/v1/doctor/alerts/${alertId}/resolve`);
    return response.data;
  },

  async addAlertNote(alertId: string, noteText: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/doctor/alerts/${alertId}/note`, { note_text: noteText });
    return response.data;
  },

  async getLatestPrediction(patientId: string): Promise<AIPrediction> {
    const response = await apiClient.get(`/api/v1/doctor/predictions/${patientId}`);
    return response.data;
  },

  async getPredictionHistory(patientId: string): Promise<AIPrediction[]> {
    const response = await apiClient.get(`/api/v1/doctor/predictions/history/${patientId}`);
    return response.data;
  },

  async refreshPrediction(patientId: string): Promise<AIPrediction> {
    const response = await apiClient.post(`/api/v1/doctor/predictions/refresh/${patientId}`);
    return response.data;
  },

  async listReports(params?: { patient_id?: string; report_type?: string }): Promise<any[]> {
    const response = await apiClient.get('/api/v1/doctor/reports', { params });
    return response.data;
  },

  async getReport(reportId: string): Promise<any> {
    const response = await apiClient.get(`/api/v1/doctor/reports/${reportId}`);
    return response.data;
  },

  async generateReport(patientId: string, reportType: string): Promise<any> {
    const response = await apiClient.post('/api/v1/doctor/reports/generate', { patient_id: patientId, report_type: reportType });
    return response.data;
  },

  async getReportPreview(reportId: string): Promise<any> {
    const response = await apiClient.get(`/api/v1/doctor/reports/${reportId}/preview`);
    return response.data;
  },

  async exportReportPDF(reportId: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/doctor/reports/${reportId}/pdf`, {}, { responseType: 'blob' });
    return response.data;
  },

  async exportReportCSV(reportId: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/doctor/reports/${reportId}/csv`);
    return response.data;
  }
};


