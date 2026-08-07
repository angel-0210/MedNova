import { UserRole } from '@mednova/types';
import { VITALS_THRESHOLDS } from '@mednova/constants';

// =========================================================================
// DATE & TIME FORMATTING
// =========================================================================
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

export const formatTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'N/A';
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

// =========================================================================
// VALIDATION HELPERS
// =========================================================================
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidMacAddress = (mac: string): boolean => {
  const re = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return re.test(mac);
};

// =========================================================================
// ERROR PARSING
// =========================================================================
export const parseAPIError = (error: any): string => {
  const data = error?.response?.data;
  // This API's error handler returns {success, message, error_code}; FastAPI's own
  // validation/HTTPException path returns {detail}. Handle both.
  if (typeof data?.message === 'string') return data.message;
  if (data?.detail) {
    const detail = data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg || JSON.stringify(detail);
    }
  }
  return error?.message || 'An unexpected connection error occurred';
};

// =========================================================================
// ROLE HELPERS
// =========================================================================
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const isAdmin = (role: UserRole): boolean => role === 'admin';
export const isDoctor = (role: UserRole): boolean => role === 'doctor';
export const isNurse = (role: UserRole): boolean => role === 'nurse';

export const canAcknowledgeAlerts = (role: UserRole): boolean => {
  return ['admin', 'doctor', 'nurse'].includes(role);
};

// =========================================================================
// COLOR HELPERS
// =========================================================================
export const getRiskLevelColor = (level: 'normal' | 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (level) {
    case 'critical':
      return '#d90429'; // Red
    case 'high':
      return '#f77f00'; // Orange
    case 'medium':
      return '#fcbf49'; // Yellow
    case 'low':
      return '#4a90e2'; // Light Blue
    case 'normal':
    default:
      return '#2a9d8f'; // Green
  }
};

export const getVitalStatusColor = (
  type: 'spo2' | 'heartRate',
  value: number
): 'stable' | 'warning' | 'critical' => {
  if (type === 'spo2') {
    if (value <= VITALS_THRESHOLDS.SPO2.CRITICAL_LOW) return 'critical';
    if (value <= VITALS_THRESHOLDS.SPO2.WARNING_LOW) return 'warning';
    return 'stable';
  } else {
    if (value <= VITALS_THRESHOLDS.HEART_RATE.CRITICAL_LOW || value >= VITALS_THRESHOLDS.HEART_RATE.CRITICAL_HIGH) {
      return 'critical';
    }
    if (value <= VITALS_THRESHOLDS.HEART_RATE.WARNING_LOW || value >= VITALS_THRESHOLDS.HEART_RATE.WARNING_HIGH) {
      return 'warning';
    }
    return 'stable';
  }
};
export const getVitalColor = (
  type: 'spo2' | 'heartRate',
  value: number
): string => {
  const status = getVitalStatusColor(type, value);
  if (status === 'critical') return '#d90429';
  if (status === 'warning') return '#f77f00';
  return '#2a9d8f';
};
