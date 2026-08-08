import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  patientRepository, alertRepository, deviceRepository, aiRepository,
  vitalsRepository, hospitalRepository, wardRepository, userRepository,
  auditRepository, doctorRepository
} from '@mednova/api';
import type { Patient, Device, UserRole, FollowUpStatus } from '@mednova/types';

// =========================================================================
// PATIENT HOOKS
// =========================================================================
export const usePatientsQuery = (params?: { search?: string; ventilator_status?: string; skip?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientRepository.listPatients(params),
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

export const useUpdatePatientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, ...payload }: { patientId: string } & Parameters<typeof patientRepository.updatePatient>[1]) =>
      patientRepository.updatePatient(patientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
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

export const useUpdateFollowUpMutation = (patientId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ predictionId, ...payload }: {
      predictionId: string;
      follow_up_status?: FollowUpStatus;
      clinician_note?: string;
    }) => aiRepository.updateFollowUp(predictionId, payload),
    onSuccess: (updated) => {
      // Write the server's row straight into the cache so the panel reflects the save
      // even though this query polls on a 15s interval.
      queryClient.setQueryData(['prediction', patientId ?? updated.patient_id], updated);
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prediction', updated.patient_id] });
    },
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
    mutationFn: (payload: Omit<Device, 'device_id' | 'created_at' | 'updated_at'> & Partial<Pick<Device, 'hospital_id' | 'status' | 'mac_address'>>) =>
      deviceRepository.registerDevice(payload as any),
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
// =========================================================================
// DOCTOR SPECIFIC HOOKS
// =========================================================================
export const useDoctorDashboardQuery = () => {
  return useQuery({
    queryKey: ['doctor', 'dashboard'],
    queryFn: () => doctorRepository.getDashboard(),
    refetchInterval: 10000, // Refresh dashboard values periodically
  });
};

export const useDoctorPatientsQuery = (params?: { search?: string; ventilator_status?: string; skip?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['doctor', 'patients', params],
    queryFn: () => doctorRepository.listPatients(params),
    refetchInterval: 15000,
  });
};

export const useDoctorPatientDetailQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['doctor', 'patient', patientId],
    queryFn: () => doctorRepository.getPatient(patientId),
    enabled: !!patientId,
  });
};

export const usePatientTimelineQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['doctor', 'patient', patientId, 'timeline'],
    queryFn: () => doctorRepository.getPatientTimeline(patientId),
    enabled: !!patientId,
    refetchInterval: 10000,
  });
};

export const useDoctorAlertsQuery = (params?: { alert_type?: string; status?: string }) => {
  return useQuery({
    queryKey: ['doctor', 'alerts', params],
    queryFn: () => doctorRepository.listAlerts(params),
    refetchInterval: 5000,
  });
};

export const useDoctorAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => doctorRepository.acknowledgeAlert(alertId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
      if (data && data.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
      }
    },
  });
};

export const useDoctorResolveAlertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => doctorRepository.resolveAlert(alertId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
      if (data && data.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
      }
    },
  });
};

export const useAddAlertNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { alertId: string; noteText: string }) => 
      doctorRepository.addAlertNote(payload.alertId, payload.noteText),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'alerts'] });
      if (data && data.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
      }
    },
  });
};

export const useAddPatientNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { patientId: string; noteText: string }) => 
      doctorRepository.addPatientNote(payload.patientId, payload.noteText),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', variables.patientId, 'timeline'] });
    },
  });
};

export const useLatestDoctorPredictionQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['doctor', 'prediction', patientId],
    queryFn: () => doctorRepository.getLatestPrediction(patientId),
    enabled: !!patientId,
    refetchInterval: 15000,
  });
};

export const usePredictionHistoryQuery = (patientId: string) => {
  return useQuery({
    queryKey: ['doctor', 'prediction', patientId, 'history'],
    queryFn: () => doctorRepository.getPredictionHistory(patientId),
    enabled: !!patientId,
  });
};

export const useRefreshPredictionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patientId: string) => doctorRepository.refreshPrediction(patientId),
    onSuccess: (data, patientId) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prediction', patientId] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prediction', patientId, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', patientId, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
    },
  });
};


export const useDoctorReportsQuery = (params?: { patient_id?: string; report_type?: string }) => {
  return useQuery({
    queryKey: ['doctor', 'reports', params],
    queryFn: () => doctorRepository.listReports(params),
    refetchInterval: 10000,
  });
};

export const useGenerateReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { patientId: string; reportType: string }) => 
      doctorRepository.generateReport(payload.patientId, payload.reportType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
      if (data && data.patient_id) {
        queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', data.patient_id, 'timeline'] });
      }
    },
  });
};

export const useReportPreviewQuery = (reportId: string) => {
  return useQuery({
    queryKey: ['doctor', 'report', reportId, 'preview'],
    queryFn: () => doctorRepository.getReportPreview(reportId),
    enabled: !!reportId,
  });
};

// =========================================================================
// USER PROFILE HOOKS
// =========================================================================
export const useUserProfileQuery = (userId: string) => {
  return useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: () => userRepository.getProfile(userId),
    enabled: !!userId,
  });
};

export const useUpdateUserProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId: string; data: any }) => 
      userRepository.updateProfile(payload.userId, payload.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile', variables.userId] });
    },
  });
};

