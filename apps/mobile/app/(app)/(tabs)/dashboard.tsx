import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePatientsQuery, useAlertsQuery } from '@mednova/hooks';
import { useAuth } from '../../../contexts/AuthContext';
import { websocketService } from '../../../services/websocketService';
import {
  Activity, Users, ShieldAlert, Wifi,
  BarChart2, LogOut, ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading: loadingPatients } = usePatientsQuery();
  const { data: alerts = [], isLoading: loadingAlerts } = useAlertsQuery();

  // Connect WebSocket for real-time telemetry and alert updates
  useEffect(() => {
    websocketService.connect(queryClient);
    return () => {
      websocketService.disconnect();
    };
  }, [queryClient]);

  const activeVentilators = patients.filter((p) => p.ventilator_status === 'active').length;
  const pendingAlerts     = alerts.filter((a) => a.status === 'pending').length;
  const criticalAlerts    = alerts.filter((a) => a.alert_type === 'critical').length;
  const systemStatus      = criticalAlerts > 0 ? 'Degraded' : 'Optimal';
  const systemStatusColor = criticalAlerts > 0 ? '#d90429' : '#2a9d8f';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Activity size={20} color="#66fcf1" strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>MedNova</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <LogOut size={16} color="#d90429" />
        </TouchableOpacity>
      </View>

      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Text style={styles.greetTitle}>Hello, {user?.name?.split(' ')[0] ?? 'Clinician'}</Text>
        <Text style={styles.greetSub}>
          {user?.role?.toUpperCase()} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>

        <View style={[styles.statCard, styles.statCardTeal]}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(102,252,241,0.12)' }]}>
            <Users size={18} color="#66fcf1" />
          </View>
          <Text style={styles.statValue}>{activeVentilators}</Text>
          <Text style={styles.statLabel}>Active{'\n'}Ventilators</Text>
        </View>

        <TouchableOpacity
          style={[styles.statCard, styles.statCardRed]}
          onPress={() => router.navigate('/(app)/(tabs)/alerts')}
          activeOpacity={0.8}
        >
          <View style={[styles.statIcon, { backgroundColor: 'rgba(217,4,41,0.12)' }]}>
            <ShieldAlert size={18} color="#d90429" />
          </View>
          <Text style={[styles.statValue, { color: '#d90429' }]}>{pendingAlerts}</Text>
          <Text style={styles.statLabel}>Pending{'\n'}Alerts</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { borderLeftColor: systemStatusColor, borderLeftWidth: 3 }]}>
          <View style={[styles.statIcon, { backgroundColor: systemStatusColor + '20' }]}>
            <Wifi size={18} color={systemStatusColor} />
          </View>
          <Text style={[styles.statValue, { color: systemStatusColor, fontSize: 14 }]}>
            {systemStatus}
          </Text>
          <Text style={styles.statLabel}>System{'\n'}Status</Text>
        </View>

      </View>

      {/* ── Quick Navigation ────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Quick Navigation</Text>
      <View style={styles.navCard}>

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.navigate('/(app)/(tabs)/patients')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={styles.navIconWrap}>
              <Users size={16} color="#66fcf1" />
            </View>
            <Text style={styles.navLabel}>Patient Registry</Text>
          </View>
          <View style={styles.navRight}>
            <Text style={styles.navCount}>{patients.length}</Text>
            <ChevronRight size={14} color="#5a5c5e" />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.navigate('/(app)/(tabs)/alerts')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconWrap, { backgroundColor: 'rgba(217,4,41,0.1)' }]}>
              <ShieldAlert size={16} color="#d90429" />
            </View>
            <Text style={styles.navLabel}>Alerts Console</Text>
          </View>
          <View style={styles.navRight}>
            {pendingAlerts > 0 && (
              <View style={styles.alertPill}>
                <Text style={styles.alertPillText}>{pendingAlerts} PENDING</Text>
              </View>
            )}
            <ChevronRight size={14} color="#5a5c5e" />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.navigate('/(app)/(tabs)/devices')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconWrap, { backgroundColor: 'rgba(102,252,241,0.08)' }]}>
              <Wifi size={16} color="#66fcf1" />
            </View>
            <Text style={styles.navLabel}>IoT Telemetry Gateways</Text>
          </View>
          <ChevronRight size={14} color="#5a5c5e" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/(app)/analytics')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <View style={[styles.navIconWrap, { backgroundColor: 'rgba(42,157,143,0.1)' }]}>
              <BarChart2 size={16} color="#2a9d8f" />
            </View>
            <Text style={styles.navLabel}>Clinical Analytics</Text>
          </View>
          <ChevronRight size={14} color="#5a5c5e" />
        </TouchableOpacity>

      </View>

      {/* ── Recent Alerts Preview ───────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          {alerts.slice(0, 3).map((alert) => (
            <View
              key={alert.alert_id}
              style={[
                styles.alertPreview,
                { borderLeftColor: alert.alert_type === 'critical' ? '#d90429' : '#f77f00' },
              ]}
            >
              <Text style={styles.alertPreviewType}>{alert.alert_type.toUpperCase()}</Text>
              <Text style={styles.alertPreviewMsg} numberOfLines={1}>{alert.message}</Text>
            </View>
          ))}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  scroll: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(102,252,241,0.1)',
    borderWidth: 1, borderColor: 'rgba(102,252,241,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  logoutBtn: {
    padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(217,4,41,0.1)',
    borderWidth: 1, borderColor: 'rgba(217,4,41,0.15)',
  },

  greeting: { marginBottom: 24 },
  greetTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  greetSub: { fontSize: 12, color: '#5a5c5e', marginTop: 4, fontWeight: '600', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#1a2130', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  statCardTeal: { borderLeftColor: '#66fcf1', borderLeftWidth: 3 },
  statCardRed:  { borderLeftColor: '#d90429', borderLeftWidth: 3 },
  statIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#66fcf1' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#5a5c5e', marginTop: 2, lineHeight: 14 },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#5a5c5e',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
  },

  navCard: {
    backgroundColor: '#1a2130', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 28, overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  navIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(102,252,241,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel: { fontSize: 14, fontWeight: '600', color: '#e2e4e6' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navCount: { fontSize: 13, fontWeight: '700', color: '#5a5c5e' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 16 },

  alertPill: {
    backgroundColor: 'rgba(217,4,41,0.15)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  alertPillText: { fontSize: 9, fontWeight: '800', color: '#d90429' },

  alertPreview: {
    backgroundColor: '#1a2130', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, marginBottom: 8,
  },
  alertPreviewType: { fontSize: 9, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  alertPreviewMsg: { fontSize: 12, color: '#8f9091', marginTop: 2 },
});
