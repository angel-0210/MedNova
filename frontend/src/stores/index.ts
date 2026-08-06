import { create } from 'zustand';
import { 
  User, Patient, SensorReading, AIPrediction, 
  Alert, Device 
} from '../types';
import { 
  authRepository, patientRepository, vitalsRepository, 
  alertRepository, aiRepository, deviceRepository 
} from '../repositories';
import { keychainService } from '../services/keychainService';

// =========================================================================
// AUTH STORE
// =========================================================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, passwordHash: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: async (email, passwordHash) => {
    set({ loading: true, error: null });
    try {
      const data = await authRepository.login(email, passwordHash);
      await keychainService.saveTokens(data.access_token, data.refresh_token);
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Authentication failed', loading: false });
      throw err;
    }
  },
  logout: async () => {
    await keychainService.clearTokens();
    set({ user: null, isAuthenticated: false });
  },
  restoreSession: async () => {
    set({ loading: true });
    try {
      const tokens = await keychainService.getTokens();
      if (tokens?.accessToken) {
        const user = await authRepository.getMe();
        set({ user, isAuthenticated: true });
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      await keychainService.clearTokens();
    } finally {
      set({ loading: false });
    }
  },
}));

// =========================================================================
// PATIENT STORE
// =========================================================================
interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  fetchPatients: () => Promise<void>;
  selectPatient: (patientId: string) => Promise<void>;
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  fetchPatients: async () => {
    set({ loading: true, error: null });
    try {
      const patients = await patientRepository.listPatients();
      set({ patients, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load patients', loading: false });
    }
  },
  selectPatient: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const selectedPatient = await patientRepository.getPatient(patientId);
      set({ selectedPatient, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to retrieve patient details', loading: false });
    }
  },
}));

// =========================================================================
// VITALS STORE
// =========================================================================
interface VitalsState {
  vitals: Record<string, SensorReading[]>; // historical logs buffered
  latestVitals: Record<string, SensorReading>;
  loading: boolean;
  error: string | null;
  addReading: (patientId: string, reading: SensorReading) => void;
  fetchHistorical: (patientId: string, startTime: string, endTime: string) => Promise<void>;
}

export const useVitalsStore = create<VitalsState>((set) => ({
  vitals: {},
  latestVitals: {},
  loading: false,
  error: null,
  addReading: (patientId, reading) => {
    set((state) => {
      const patientReadings = state.vitals[patientId] || [];
      const updatedReadings = [...patientReadings, reading].slice(-100); // Buffer up to 100 historical readings
      return {
        latestVitals: { ...state.latestVitals, [patientId]: reading },
        vitals: { ...state.vitals, [patientId]: updatedReadings },
      };
    });
  },
  fetchHistorical: async (patientId, startTime, endTime) => {
    set({ loading: true, error: null });
    try {
      const readings = await vitalsRepository.getHistoricalReadings(patientId, startTime, endTime);
      set((state) => ({
        vitals: { ...state.vitals, [patientId]: readings },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch historical readings', loading: false });
    }
  },
}));

// =========================================================================
// ALERT STORE
// =========================================================================
interface AlertState {
  activeAlerts: Alert[];
  loading: boolean;
  error: string | null;
  fetchActiveAlerts: () => Promise<void>;
  acknowledge: (alertId: string) => Promise<void>;
  resolve: (alertId: string) => Promise<void>;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlerts: [],
  loading: false,
  error: null,
  fetchActiveAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const alerts = await alertRepository.listActiveAlerts();
      set({ activeAlerts: alerts, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load active alerts', loading: false });
    }
  },
  acknowledge: async (alertId) => {
    set({ loading: true });
    try {
      const updated = await alertRepository.acknowledgeAlert(alertId);
      set((state) => ({
        activeAlerts: state.activeAlerts.map((a) => a.alert_id === alertId ? updated : a),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to acknowledge alert', loading: false });
    }
  },
  resolve: async (alertId) => {
    set({ loading: true });
    try {
      await alertRepository.resolveAlert(alertId);
      set((state) => ({
        activeAlerts: state.activeAlerts.filter((a) => a.alert_id !== alertId),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to resolve alert', loading: false });
    }
  },
  addAlert: (alert) => {
    set((state) => ({
      activeAlerts: [alert, ...state.activeAlerts.filter((a) => a.alert_id !== alert.alert_id)],
    }));
  },
  removeAlert: (alertId) => {
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((a) => a.alert_id !== alertId),
    }));
  },
}));

// =========================================================================
// AI STORE
// =========================================================================
interface AIState {
  predictions: Record<string, AIPrediction>;
  loading: boolean;
  error: string | null;
  fetchLatestPrediction: (patientId: string) => Promise<void>;
  addPrediction: (patientId: string, prediction: AIPrediction) => void;
}

export const useAIStore = create<AIState>((set) => ({
  predictions: {},
  loading: false,
  error: null,
  fetchLatestPrediction: async (patientId) => {
    set({ loading: true, error: null });
    try {
      const prediction = await aiRepository.getLatestPrediction(patientId);
      set((state) => ({
        predictions: { ...state.predictions, [patientId]: prediction },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to load AI prediction', loading: false });
    }
  },
  addPrediction: (patientId, prediction) => {
    set((state) => ({
      predictions: { ...state.predictions, [patientId]: prediction },
    }));
  },
}));

// =========================================================================
// DEVICE STORE
// =========================================================================
interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
  fetchDevices: () => Promise<void>;
  pairDevice: (deviceId: string, patientId: string, hospitalId: string) => Promise<void>;
  unpairDevice: (assignmentId: string) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  loading: false,
  error: null,
  fetchDevices: async () => {
    set({ loading: true, error: null });
    try {
      const devices = await deviceRepository.listDevices();
      set({ devices, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load devices', loading: false });
    }
  },
  pairDevice: async (deviceId, patientId, hospitalId) => {
    set({ loading: true });
    try {
      await deviceRepository.assignDevice({ device_id: deviceId, patient_id: patientId, hospital_id: hospitalId });
      // Reload devices to sync paired details
      const devices = await deviceRepository.listDevices();
      set({ devices, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to pair device', loading: false });
      throw err;
    }
  },
  unpairDevice: async (assignmentId) => {
    set({ loading: true });
    try {
      await deviceRepository.unassignDevice(assignmentId);
      // Reload devices
      const devices = await deviceRepository.listDevices();
      set({ devices, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to unpair device', loading: false });
      throw err;
    }
  },
}));
