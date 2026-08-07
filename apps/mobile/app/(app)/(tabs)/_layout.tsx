import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LayoutDashboard, Users, ShieldAlert, Wifi, User } from 'lucide-react-native';
import { useRBAC } from '../../../contexts/RBACContext';
import { useAlertsQuery } from '@mednova/hooks';

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
// Tab icon with optional badge
// ─────────────────────────────────────────────────────────────────────────────

interface TabIconProps {
  icon: React.ReactNode;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, badge }) => (
  <View style={styles.iconContainer}>
    {icon}
    {badge !== undefined && <AlertBadge count={badge} />}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar layout
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#66fcf1';
const INACTIVE_COLOR = '#5a5c5e';
const TAB_BG = '#151a22';
const BORDER_COLOR = 'rgba(102, 252, 241, 0.08)';

export default function TabsLayout() {
  const { canViewDevicesTab } = useRBAC();
  const { data: alerts = [] } = useAlertsQuery();

  const pendingAlertCount = alerts.filter((a) => a.status === 'pending').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
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
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<LayoutDashboard size={22} color={color} />} />
          ),
        }}
      />

      {/* ── Patients ─────────────────────────────────────────────── */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<Users size={22} color={color} />} />
          ),
        }}
      />

      {/* ── Alerts (with live badge) ──────────────────────────────── */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <TabIcon
              icon={<ShieldAlert size={22} color={color} />}
              badge={pendingAlertCount}
            />
          ),
        }}
      />

      {/* ── Devices (hidden for attendant) ────────────────────────── */}
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          // href: null removes the button from the tab bar while keeping the route accessible
          // so direct URL navigation also falls through to the RBAC check inside the screen.
          href: canViewDevicesTab ? undefined : null,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<Wifi size={22} color={color} />} />
          ),
        }}
      />

      {/* ── Profile ──────────────────────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon icon={<User size={22} color={color} />} />
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
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#d90429',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 14,
  },
});
