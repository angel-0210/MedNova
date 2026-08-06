import { useAuthStore } from '../stores';
import { UserRole } from '../types';

export const useRoleAccess = () => {
  const { user } = useAuthStore();
  const role: UserRole = user?.role || 'attendant';

  const permissions = {
    canRegisterDevices: role === 'admin',
    canEditPatients: ['admin', 'doctor', 'nurse'].includes(role),
    canAcknowledgeAlerts: ['admin', 'doctor', 'nurse'].includes(role),
    canResolveAlerts: ['admin', 'doctor', 'nurse'].includes(role),
    canPairDevices: ['admin', 'doctor', 'nurse'].includes(role),
    canViewReports: ['admin', 'doctor', 'nurse'].includes(role),
    canViewVitals: true, // All roles can view live vitals
  };

  return {
    role,
    ...permissions,
  };
};
export type RoleAccessType = ReturnType<typeof useRoleAccess>;
