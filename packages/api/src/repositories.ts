import { apiClient } from './client.js';
import { 
  User, Patient, SensorReading, AIPrediction, 
  Alert, Device, DeviceAssignment 
} from '@mednova/types';

export const authRepository = {
  async login(email: string, passwordHash: string): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const response = await apiClient.post('/api/v1/auth/login', { email, password_hash: passwordHash });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },
};

export const patientRepository = {
  async listPatients(): Promise<Patient[]> {
    const response = await apiClient.get('/api/v1/patients');
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

  async unassignDevice(assignmentId: string): Promise<DeviceAssignment> {
    const response = await apiClient.post(`/api/v1/assignments/${assignmentId}/unassign`);
    return response.data;
  },
};
