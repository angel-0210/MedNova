import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  patientRepository, alertRepository, deviceRepository, aiRepository,
  vitalsRepository, hospitalRepository, wardRepository, userRepository,
  auditRepository
} from '@mednova/api';
import type { Patient, Device, UserRole } from '@mednova/types';

// =========================================================================
// PATIENT HOOKS
// =========================================================================
export const usePatientsQuery = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => patientRepository.listPatients(),
    refetchInterval: 10000, // Sync list every 10 seconds
  });
};

export const useCreatePatientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Patient, 'patient_id' | 'admission_date' | 'created_at' | 'updated_at'>) =>
      patientRepository.createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const usePatientDetailsQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientRepository.getPatient(patientId),
    enabled: !!patientId,
  });
};

// =========================================================================
// VITALS HOOKS
// =========================================================================
export const useLatestVitalsQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['vitals', 'latest', patientId],
    queryFn: () => vitalsRepository.getLatestReading(patientId),
    enabled: !!patientId,
    refetchInterval: 2000, // Poll vital status every 2 seconds for live graphs
  });
};

export const useHistoricalVitalsQuery = (patientId: string, startTime: string, endTime: string) => {
  return useQuery({
    queryKey: ['vitals', 'historical', patientId, startTime, endTime],
    queryFn: () => vitalsRepository.getHistoricalReadings(patientId, startTime, endTime),
    enabled: !!patientId && !!startTime && !!endTime,
  });
};

// =========================================================================
// ALERT HOOKS
// =========================================================================
export const useAlertsQuery = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertRepository.listActiveAlerts(),
    refetchInterval: 5000, // Poll active alerts list every 5 seconds
  });
};

export const useAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => alertRepository.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useResolveAlertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => alertRepository.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// =========================================================================
// AI PREDICTION HOOKS
// =========================================================================
export const useAIPredictionQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['prediction', patientId],
    queryFn: () => aiRepository.getLatestPrediction(patientId),
    enabled: !!patientId,
    refetchInterval: 15000, // Sync prediction every 15 seconds
  });
};

// =========================================================================
// DEVICE HOOKS
// =========================================================================
export const useDevicesQuery = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceRepository.listDevices(),
    refetchInterval: 8000,
  });
};

export const useAssignmentsQuery = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: () => deviceRepository.listAssignments(),
    refetchInterval: 8000,
  });
};

export const useRegisterDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Device, 'device_id' | 'created_at' | 'updated_at'>) =>
      deviceRepository.registerDevice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

const invalidatePairing = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['devices'] });
  queryClient.invalidateQueries({ queryKey: ['patients'] });
  queryClient.invalidateQueries({ queryKey: ['assignments'] });
};

export const usePairDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { device_id: string; patient_id: string; hospital_id: string }) =>
      deviceRepository.assignDevice(payload),
    onSuccess: () => invalidatePairing(queryClient),
  });
};

export const useUnpairDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => deviceRepository.unassignDevice(assignmentId),
    onSuccess: () => invalidatePairing(queryClient),
  });
};

// =========================================================================
// HOSPITAL / WARD / STAFF / AUDIT HOOKS
// =========================================================================
export const useHospitalQuery = (hospitalId?: string) => {
  return useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => hospitalRepository.getHospital(hospitalId!),
    enabled: !!hospitalId,
  });
};

export const useCreateHospitalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; hospital_code: string; address?: string }) =>
      hospitalRepository.createHospital(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital'] });
    },
  });
};

export const useWardsQuery = () => {
  return useQuery({
    queryKey: ['wards'],
    queryFn: () => wardRepository.listWards(),
  });
};

export const useCreateWardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; unit_type: string; hospital_id: string }) =>
      wardRepository.createWard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wards'] });
    },
  });
};

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userRepository.listUsers(),
  });
};

export const useCreateStaffMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string; role: UserRole }) =>
      userRepository.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAuditLogsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditRepository.listLogs(),
    enabled,
    refetchInterval: 30000,
  });
};
