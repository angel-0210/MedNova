import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@mednova/types';

// ─────────────────────────────────────────────────────────────────────────────
// Permission Map
// ─────────────────────────────────────────────────────────────────────────────

export interface RBACPermissions {
  /** Current user role */
  role: UserRole;

  // ── Navigation visibility ──────────────────────────────────────────────────
  /** Whether the Devices tab is visible (hidden for attendant) */
  canViewDevicesTab: boolean;

  // ── Patient actions ────────────────────────────────────────────────────────
  /** Create / edit patient records */
  canEditPatients: boolean;

  // ── Alert actions ──────────────────────────────────────────────────────────
  /** Acknowledge an active alert */
  canAcknowledgeAlerts: boolean;
  /** Mark an alert as resolved */
  canResolveAlerts: boolean;

  // ── Device actions ─────────────────────────────────────────────────────────
  /** Register a new device (admin only) */
  canRegisterDevices: boolean;
  /** Pair a device to a patient */
  canPairDevices: boolean;
  /** Disconnect / unassign a device */
  canUnpairDevices: boolean;

  // ── Data visibility ────────────────────────────────────────────────────────
  /** View live vitals & sensor readings (all roles) */
  canViewVitals: boolean;
  /** View historical reports */
  canViewReports: boolean;
  /** View audit log (admin only) */
  canViewAuditLogs: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const RBACContext = createContext<RBACPermissions | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RBACProvider must be placed INSIDE AuthProvider so that it can read
 * the current user via `useAuth()`.
 */
export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const role: UserRole = user?.role ?? 'attendant';

  const isClinician = (['admin', 'doctor', 'nurse'] as UserRole[]).includes(role);

  const permissions: RBACPermissions = {
    role,

    // Navigation
    canViewDevicesTab: isClinician,

    // Patients
    canEditPatients: isClinician,

    // Alerts
    canAcknowledgeAlerts: isClinician,
    canResolveAlerts: isClinician,

    // Devices
    canRegisterDevices: role === 'admin',
    canPairDevices: isClinician,
    canUnpairDevices: isClinician,

    // Data
    canViewVitals: true,
    canViewReports: isClinician,
    canViewAuditLogs: role === 'admin',
  };

  return <RBACContext.Provider value={permissions}>{children}</RBACContext.Provider>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useRBAC = (): RBACPermissions => {
  const ctx = useContext(RBACContext);
  if (!ctx) {
    throw new Error('useRBAC must be used within <RBACProvider>');
  }
  return ctx;
};
