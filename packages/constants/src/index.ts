export const VITALS_THRESHOLDS = {
  SPO2: {
    CRITICAL_LOW: 85,
    WARNING_LOW: 92,
    NORMAL_MIN: 95,
  },
  HEART_RATE: {
    CRITICAL_LOW: 40,
    WARNING_LOW: 50,
    NORMAL_MIN: 60,
    NORMAL_MAX: 100,
    WARNING_HIGH: 120,
    CRITICAL_HIGH: 140,
  },
  TEMPERATURE: {
    CRITICAL_LOW: 35.0,
    NORMAL_MIN: 36.1,
    NORMAL_MAX: 37.2,
    WARNING_HIGH: 38.0,
    CRITICAL_HIGH: 39.0,
  },
};

export const USER_ROLES = {
  ADMIN: 'admin' as const,
  DOCTOR: 'doctor' as const,
  NURSE: 'nurse' as const,
  ATTENDANT: 'attendant' as const,
};

export const API_TIMEOUT = 10000;

export const DEFAULT_POLLING_INTERVAL = 3000; // 3 seconds for live dashboard telemetry
export const ACTIVE_ALERT_REFRESH_INTERVAL = 5000; // 5 seconds for critical alerts check
