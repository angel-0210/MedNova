import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { useTheme } from '../theme/ThemeProvider';

interface RoleGuardProps {
  permission: keyof ReturnType<typeof useRoleAccess>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  permission,
  children,
  fallback,
}) => {
  const roleAccess = useRoleAccess();
  const { colors, typography } = useTheme();

  const hasAccess = !!roleAccess[permission];

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    
    // Default Access Denied indicator
    return (
      <View style={[styles.deniedContainer, { backgroundColor: colors.background }]}>
        <Text style={[typography.headlineLgMobile, { color: colors.statusCritical, fontWeight: 'bold' }]}>
          Access Denied
        </Text>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }]}>
          Your role ({roleAccess.role.toUpperCase()}) is not authorized to access this feature.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  deniedContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});
