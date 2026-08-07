import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Users, ShieldAlert, Wifi, User, Brain, FileText } from 'lucide-react-native';
import { useRBAC } from '../../../contexts/RBACContext';
import { useAlertsQuery } from '@mednova/hooks';
import { theme } from '../../../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Alert badge component for the Alerts tab
// ─────────────────────────────────────────────────────────────────────────────

const AlertBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab icon with optional badge and active background capsule
// ─────────────────────────────────────────────────────────────────────────────

interface TabIconProps {
  icon: React.ReactNode;
  badge?: number;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, badge, focused }) => (
  <View style={[
    styles.iconContainer,
    focused && {
      backgroundColor: theme.colors.secondaryContainer,
      borderRadius: 16,
      width: 52,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    }
  ]}>
    {icon}
    {badge !== undefined && <AlertBadge count={badge} />}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar layout
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR = theme.colors.primary;
const INACTIVE_COLOR = theme.colors.outline;
const TAB_BG = theme.colors.backgroundMain;
const BORDER_COLOR = theme.colors.outlineVariant + '33';

export default function TabsLayout() {
  const { canViewDevicesTab, canViewPredictionsTab, canViewReportsTab } = useRBAC();
  const { data: alerts = [] } = useAlertsQuery();
  const insets = useSafeAreaInsets();

  const pendingAlertCount = alerts.filter((a) => a.status === 'pending').length;
  
  // Calculate dynamic bottom margin based on safe area to sit above gesture nav
  const bottomInset = insets.bottom > 0 ? insets.bottom : 16;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomInset,
          left: 16,
          right: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 32,
          borderTopWidth: 0,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: theme.typography.labelCaps.fontFamily,
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      {/* ── Dashboard ────────────────────────────────────────────── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<LayoutDashboard size={20} color={color} />} focused={focused} />
          ),
        }}
      />

      {/* ── Patients ─────────────────────────────────────────────── */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<Users size={20} color={color} />} focused={focused} />
          ),
        }}
      />

      {/* ── Alerts (with live badge) ──────────────────────────────── */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={<ShieldAlert size={20} color={color} />}
              badge={pendingAlertCount}
              focused={focused}
            />
          ),
        }}
      />

      {/* ── Predictions (Doctor only) ──────────────────────────────── */}
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'AI Forecasts',
          href: canViewPredictionsTab ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<Brain size={20} color={color} />} focused={focused} />
          ),
        }}
      />

      {/* ── Reports (Doctor only) ─────────────────────────────────── */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          href: canViewReportsTab ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<FileText size={20} color={color} />} focused={focused} />
          ),
        }}
      />

      {/* ── Devices (hidden for attendant/doctor) ─────────────────── */}
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          href: canViewDevicesTab ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<Wifi size={20} color={color} />} focused={focused} />
          ),
        }}
      />

      {/* ── Profile (hidden for doctor) ──────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: canViewPredictionsTab ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={<User size={20} color={color} />} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 52,
    height: 32,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 14,
  },
});

