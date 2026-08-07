import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { usePatientsQuery, useAlertsQuery, useDevicesQuery, useDoctorDashboardQuery, useDoctorAcknowledgeAlertMutation } from '@mednova/hooks';
import { useAuth } from '../../../contexts/AuthContext';
import { useRBAC } from '../../../contexts/RBACContext';
import { websocketService } from '../../../services/websocketService';
import {
  Activity, Users, ShieldAlert, Wifi,
  BarChart2, LogOut, ChevronRight, Search,
  Bell, Sparkles, Brain, History, Heart,
  Info, Cpu, Pause, Play, CheckCircle, FileText, ClipboardList
} from 'lucide-react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../../constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { role } = useRBAC();
  const queryClient = useQueryClient();

  // Connect WebSocket for real-time telemetry and alert updates
  useEffect(() => {
    websocketService.connect(queryClient);
    return () => {
      websocketService.disconnect();
    };
  }, [queryClient]);

  if (role === 'doctor') {
    return <DoctorDashboard user={user} logout={logout} />;
  }

  const { data: patients = [], isLoading: loadingPatients } = usePatientsQuery();
  const { data: alerts = [], isLoading: loadingAlerts } = useAlertsQuery();
  const { data: devices = [], isLoading: loadingDevices } = useDevicesQuery();
  
  const [isFrozen, setIsFrozen] = React.useState(false);

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
  const systemStatusColor = criticalAlerts > 0 ? theme.colors.statusCritical : theme.colors.statusStable;

  const onlineDevices  = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = devices.filter((d) => d.status !== 'online').length;

  if (loadingPatients || loadingAlerts || loadingDevices) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. Greeting Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'C'}
              </Text>
            </View>
            <View>
              <Text style={[styles.greetTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>
                Dr. {user?.name?.split(' ').pop() ?? 'Clinician'}
              </Text>
              <Text style={[styles.greetSub, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                {user?.role?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconBtn, { borderColor: theme.colors.outlineVariant }]} activeOpacity={0.7}>
              <Search size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, { borderColor: theme.colors.outlineVariant }]} 
              onPress={() => router.navigate('/(app)/(tabs)/alerts')}
              activeOpacity={0.7}
            >
              <Bell size={18} color={theme.colors.primary} />
              {pendingAlerts > 0 && <View style={[styles.alertDot, { backgroundColor: theme.colors.statusCritical }]} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, styles.logoutBtn, { borderColor: theme.colors.outlineVariant }]} 
              onPress={logout} 
              activeOpacity={0.7}
            >
              <LogOut size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Hospital / User Summary ─────────────────────────────────────── */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.summaryLeft}>
            <View style={[styles.statusDot, { backgroundColor: '#2a9d8f' }]} />
            <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '700', fontSize: 11 }]}>
              ICU Central Ward
            </Text>
          </View>
          <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* ── 3. Critical Statistics Cards ────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {/* Active Ventilators */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <View style={styles.statHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(20,33,61,0.05)' }]}>
                  <Activity size={18} color={theme.colors.statusStable} />
                </View>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>Ventilators</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {activeVentilators}<Text style={styles.statTotal}>/{patients.length || 30}</Text>
              </Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${(activeVentilators / (patients.length || 30)) * 100}%`, backgroundColor: theme.colors.statusStable }]} />
              </View>
            </View>

            {/* Active Alerts */}
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
              onPress={() => router.navigate('/(app)/(tabs)/alerts')}
              activeOpacity={0.8}
            >
              <View style={styles.statHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(252,163,17,0.1)' }]}>
                  <ShieldAlert size={18} color={theme.colors.statusCritical} />
                </View>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>Alerts</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.statusCritical }]}>
                {pendingAlerts}
              </Text>
              <View style={styles.roomChipsRow}>
                {alerts.filter((a) => a.status === 'pending').slice(0, 2).map((a, i) => {
                  const pat = patients.find((p) => p.patient_id === a.patient_id);
                  const bedNum = pat?.bed_number || 'N/A';
                  return (
                    <View key={i} style={[styles.roomChip, { backgroundColor: theme.colors.statusCritical + '15' }]}>
                      <Text style={[styles.roomChipText, { color: theme.colors.statusCritical }]}>Rm {bedNum}</Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          </View>

          {/* System Status Card */}
          <View style={[styles.statusCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant, borderLeftWidth: 4, borderLeftColor: systemStatusColor }]}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusCardTitleRow}>
                <Cpu size={16} color={systemStatusColor} />
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>System Status</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: systemStatusColor + '15' }]}>
                <Text style={[styles.statusBadgeText, { color: systemStatusColor }]}>{systemStatus.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.statusText, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
              {systemStatus === 'Optimal' ? 'All vital telemetry gateways and clinical AI prediction nodes online.' : 'Some gateways reporting active critical alerts.'}
            </Text>
          </View>
        </View>

        {/* ── 4. Active Alerts Banner ────────────────────────────────────────── */}
        {alerts.filter(a => a.status === 'pending').length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Active Alerts</Text>
            {alerts.filter(a => a.status === 'pending').slice(0, 1).map((alert) => (
              <View
                key={alert.alert_id}
                style={[
                  styles.alertCard,
                  { 
                    backgroundColor: theme.colors.backgroundMain,
                    borderColor: theme.colors.outlineVariant,
                    borderLeftColor: alert.alert_type === 'critical' ? theme.colors.statusCritical : theme.colors.secondaryContainer,
                  },
                ]}
              >
                <View style={styles.alertCardHeader}>
                  <View style={styles.alertTagRow}>
                    <ShieldAlert size={14} color={theme.colors.statusCritical} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.statusCritical, fontWeight: '800' }]}>
                      {alert.alert_type.toUpperCase()}
                    </Text>
                  </View>
                  {(() => {
                    const pat = patients.find((p) => p.patient_id === alert.patient_id);
                    return (
                      <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
                        Room {pat?.bed_number || 'N/A'}
                      </Text>
                    );
                  })()}
                </View>
                <Text style={[theme.typography.bodySm, { color: theme.colors.onSurface, marginTop: 4, fontWeight: '600' }]}>
                  {alert.message}
                </Text>
                <View style={styles.alertActionsRow}>
                  <TouchableOpacity 
                    style={[styles.alertActionBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.navigate('/(app)/(tabs)/alerts')}
                    activeOpacity={0.8}
                  >
                    <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>Open Console</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── 5. AI Insights Recommendation ──────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>AI Clinical Recommendation</Text>
          <View style={[styles.insightCard, { backgroundColor: theme.colors.primaryContainer }]}>
            <View style={styles.insightHeader}>
              <Sparkles size={16} color={theme.colors.secondaryContainer} />
              <Text style={[theme.typography.labelCaps, { color: theme.colors.secondaryContainer, fontWeight: '800' }]}>MedNova AI</Text>
            </View>
            <Text style={[styles.insightText, { color: '#ffffff' }]}>
              {criticalAlerts > 0 
                ? `Active desynchrony alert detected in Room 402. Neural analysis indicates high probability of weaning failure. Recommended action: Check pressure support and blood gas parameters.`
                : 'All patient telemetry channels within normal limits. Neural trend analysis predicts low risk of pulmonary events over the next 4 hours.'}
            </Text>
          </View>
        </View>

        {/* ── 6. Device Connectivity Status ──────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Telemetry Gateways</Text>
          <View style={[styles.deviceCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.deviceCardHeader}>
              <View style={styles.deviceTitleRow}>
                <Wifi size={16} color={theme.colors.statusStable} />
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '700' }]}>IoT Telemetry Gateways</Text>
              </View>
              <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
                {devices.length} Total Devices
              </Text>
            </View>
            <View style={styles.deviceStatsRow}>
              <View style={styles.deviceStatCell}>
                <Text style={[styles.deviceStatVal, { color: '#2a9d8f' }]}>{onlineDevices}</Text>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>Online</Text>
              </View>
              <View style={styles.deviceDivider} />
              <View style={styles.deviceStatCell}>
                <Text style={[styles.deviceStatVal, { color: theme.colors.statusCritical }]}>{offlineDevices}</Text>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>Offline</Text>
              </View>
              <View style={styles.deviceDivider} />
              <View style={styles.deviceStatCell}>
                <Text style={[styles.deviceStatVal, { color: theme.colors.primary }]}>
                  {devices.filter((d) => (d.battery_level ?? 100) < 20).length}
                </Text>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>Low Battery</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 7. Recent Ward Activity ────────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Recent Ward Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            {[
              { time: '2m ago', icon: Activity, text: 'Ventilator settings updated for Bed 03' },
              { time: '15m ago', icon: ShieldAlert, text: 'Room 402 critical blood pressure alarm triggered' },
              { time: '1h ago', icon: Info, text: 'Dr. Mitchell completed ward rounds audit' },
            ].map((activity, index) => (
              <View key={index} style={[styles.activityItem, index > 0 && styles.activityBorder]}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconWrap, { backgroundColor: theme.colors.surface }]}>
                    <activity.icon size={12} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.activityText, theme.typography.bodySm, { color: theme.colors.onSurface }]}>
                    {activity.text}
                  </Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 8. Patient Overview Beds ───────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginBottom: 0 }]}>ICU Beds</Text>
            <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
              {patients.length} Occupied
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientScroll}>
            {patients.map((patient) => {
              const hasAlert = alerts.some((a) => a.patient_id === patient.patient_id && a.status === 'pending');
              const statusColor = hasAlert ? theme.colors.statusCritical : '#2a9d8f';
              return (
                <TouchableOpacity
                  key={patient.patient_id}
                  style={[styles.patientCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
                  onPress={() => router.push({ pathname: '/(app)/patient/[id]', params: { id: patient.patient_id } })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.patientStripe, { backgroundColor: statusColor }]} />
                  <View style={styles.patientCardInner}>
                    <Text style={styles.patientBed}>Bed {patient.bed_number || 'N/A'}</Text>
                    <Text style={[styles.patientName, theme.typography.bodySm, { color: theme.colors.primary }]} numberOfLines={1}>
                      {patient.name}
                    </Text>
                    <View style={[styles.patientStatusBadge, { backgroundColor: statusColor + '15' }]}>
                      <Text style={[styles.patientStatusText, { color: statusColor }]}>
                        {hasAlert ? 'WARNING' : 'STABLE'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 9. Bedside Telemetry Waveforms ─────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Bedside Telemetry Focus</Text>
          <View style={[styles.focusCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.focusHeader}>
              <View>
                <Text style={[theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>Bed 04 · John Doe</Text>
                <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>58M · Ventilator Support Active</Text>
              </View>
              <Heart size={18} color={theme.colors.statusCritical} />
            </View>

            {/* ECG wave */}
            <View style={styles.waveBlock}>
              <View style={styles.waveHeader}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>ECG</Text>
                <Text style={[theme.typography.headlineLgMobile, { color: theme.colors.statusCritical, fontWeight: '800', fontSize: 18 }]}>
                  140 <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>bpm</Text>
                </Text>
              </View>
              <View style={styles.waveChart}>
                <Svg width="100%" height="56" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <Path
                    d={isFrozen 
                      ? "M0,50 L40,50 L45,30 L55,90 L65,10 L75,70 L80,50 L120,50 L125,30 L135,90 L145,10 L155,70 L160,50 L200,50 L205,30 L215,90 L225,10 L235,70 L240,50 L280,50 L285,30 L295,90 L305,10 L315,70 L320,50"
                      : "M0,50 L40,50 L45,30 L55,90 L65,10 L75,70 L80,50 L120,50 L125,30 L135,90 L145,10 L155,70 L160,50 L200,50 L205,30 L215,90 L225,10 L235,70 L240,50 L280,50 L285,30 L295,90 L305,10 L315,70 L320,50 L360,50 L365,30 L375,90 L385,10 L395,70 L400,50"
                    }
                    fill="none"
                    stroke={theme.colors.statusCritical}
                    strokeWidth="2.5"
                  />
                </Svg>
              </View>
            </View>

            {/* SpO2 wave */}
            <View style={styles.waveBlock}>
              <View style={styles.waveHeader}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>SpO2</Text>
                <Text style={[theme.typography.headlineLgMobile, { color: theme.colors.statusStable, fontWeight: '800', fontSize: 18 }]}>
                  92 <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>%</Text>
                </Text>
              </View>
              <View style={styles.waveChart}>
                <Svg width="100%" height="56" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <Path
                    d={isFrozen
                      ? "M0,70 Q20,70 30,40 T60,70 Q80,70 90,40 T120,70 Q140,70 150,40 T180,70 Q200,70 210,40 T240,70 Q260,70 270,40 T300,70"
                      : "M0,70 Q20,70 30,40 T60,70 Q80,70 90,40 T120,70 Q140,70 150,40 T180,70 Q200,70 210,40 T240,70 Q260,70 270,40 T300,70 Q320,70 330,40 T360,70 Q380,70 390,40 T400,70"
                    }
                    fill="none"
                    stroke={theme.colors.statusStable}
                    strokeWidth="2.5"
                  />
                </Svg>
              </View>
            </View>

            <View style={styles.waveButtonsRow}>
              <TouchableOpacity
                style={[styles.waveBtn, { borderColor: theme.colors.outlineVariant }]}
                onPress={() => setIsFrozen(!isFrozen)}
                activeOpacity={0.8}
              >
                {isFrozen ? (
                  <>
                    <Play size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>UNFREEZE</Text>
                  </>
                ) : (
                  <>
                    <Pause size={12} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>FREEZE WAVE</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.waveBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                onPress={() => {
                  const focusPatient = patients.find((p) => p.name.includes('John Doe') || p.bed_number === '04' || p.bed_number === '4');
                  if (focusPatient) {
                    router.push({ pathname: '/(app)/patient/[id]', params: { id: focusPatient.patient_id } });
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>OPEN FULL CHART</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 10. Secondary Info Footer ──────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MedNova Mobile · v2.4.0</Text>
          <Text style={styles.footerText}>Database status: Synchronized · Gateway latency: 12ms</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  greetTitle: {
    lineHeight: 18,
  },
  greetSub: {
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
  },
  alertDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  statTotal: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.5,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    backgroundColor: '#eeeeee',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  roomChipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  roomChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomChipText: {
    fontSize: 8,
    fontWeight: '700',
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusText: {
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 10,
    fontWeight: '700',
  },
  alertCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  alertActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  insightCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
  },
  deviceCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  deviceStatCell: {
    alignItems: 'center',
  },
  deviceStatVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  deviceDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#eeeeee',
  },
  activityCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activityIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    fontSize: 12,
  },
  activityTime: {
    fontSize: 10,
    opacity: 0.5,
  },
  patientScroll: {
    gap: 10,
    paddingRight: 16,
  },
  patientCard: {
    width: 120,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  patientStripe: {
    height: 4,
  },
  patientCardInner: {
    padding: 12,
  },
  patientBed: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.5,
  },
  patientName: {
    fontWeight: '700',
    marginVertical: 4,
  },
  patientStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  patientStatusText: {
    fontSize: 8,
    fontWeight: '700',
  },
  focusCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 10,
    marginBottom: 12,
  },
  waveBlock: {
    marginBottom: 12,
  },
  waveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  waveChart: {
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  waveButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  waveBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    opacity: 0.4,
  },
});


// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function DoctorDashboard({ user, logout }: { user: any; logout: () => void }) {
  const { data, isLoading } = useDoctorDashboardQuery();
  const ackMutation = useDoctorAcknowledgeAlertMutation();

  if (isLoading) {
    return (
      <View style={[docStyles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const stats = data?.stats || {
    total_patients: 0,
    critical_patients: 0,
    pending_alerts: 0,
    acknowledged_alerts: 0,
    average_risk_score: 0,
    online_devices: 0
  };

  const recentAlerts = data?.recent_alerts || [];
  const recentPredictions = data?.recent_predictions || [];
  const recentReports = data?.recent_reports || [];

  const handleAcknowledge = async (alertId: string) => {
    try {
      await ackMutation.mutateAsync(alertId);
      Alert.alert('Alert Acknowledged', 'The alert status has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to acknowledge alert.');
    }
  };

  return (
    <SafeAreaView style={[docStyles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={docStyles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={docStyles.header}>
          <View style={docStyles.headerLeft}>
            <View style={[docStyles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
              <Text style={docStyles.avatarText}>
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'DR'}
              </Text>
            </View>
            <View>
              <Text style={[docStyles.greetTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>
                Dr. {user?.name?.split(' ').pop() ?? 'Physician'}
              </Text>
              <Text style={[docStyles.greetSub, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>
                Supervising Doctor · ICU Wards
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[docStyles.logoutBtn, { borderColor: theme.colors.outlineVariant }]} 
            onPress={logout} 
            activeOpacity={0.7}
          >
            <LogOut size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Row */}
        <Text style={[docStyles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Quick Navigation</Text>
        <View style={docStyles.quickGrid}>
          <TouchableOpacity 
            style={[docStyles.quickCard, { backgroundColor: '#e0f2fe' }]} 
            onPress={() => router.push('/(app)/monitoring')}
            activeOpacity={0.8}
          >
            <Activity size={20} color="#0284c7" />
            <Text style={[docStyles.quickLabel, theme.typography.labelCaps, { color: '#0284c7' }]}>Live Vitals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[docStyles.quickCard, { backgroundColor: '#fee2e2' }]} 
            onPress={() => router.push('/(app)/(tabs)/alerts')}
            activeOpacity={0.8}
          >
            <ShieldAlert size={20} color="#dc2626" />
            <Text style={[docStyles.quickLabel, theme.typography.labelCaps, { color: '#dc2626' }]}>ICU Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[docStyles.quickCard, { backgroundColor: '#f3e8ff' }]} 
            onPress={() => router.push('/(app)/(tabs)/predictions')}
            activeOpacity={0.8}
          >
            <Brain size={20} color="#7c3aed" />
            <Text style={[docStyles.quickLabel, theme.typography.labelCaps, { color: '#7c3aed' }]}>AI Forecasts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[docStyles.quickCard, { backgroundColor: '#e2fcf4' }]} 
            onPress={() => router.push('/(app)/(tabs)/reports')}
            activeOpacity={0.8}
          >
            <ClipboardList size={20} color="#0d9488" />
            <Text style={[docStyles.quickLabel, theme.typography.labelCaps, { color: '#0d9488' }]}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Top Summary Stats */}
        <Text style={[docStyles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>ICU Ward Status</Text>
        <View style={docStyles.statsGrid}>
          <View style={[docStyles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[docStyles.statLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>ICU Patients</Text>
            <Text style={[docStyles.statValue, { color: theme.colors.primary }]}>{stats.total_patients}</Text>
          </View>
          <View style={[docStyles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[docStyles.statLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Critical Cases</Text>
            <Text style={[docStyles.statValue, { color: theme.colors.statusCritical }]}>{stats.critical_patients}</Text>
          </View>
          <View style={[docStyles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[docStyles.statLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Avg Risk Score</Text>
            <Text style={[docStyles.statValue, { color: stats.average_risk_score > 50 ? theme.colors.statusCritical : theme.colors.statusStable }]}>{stats.average_risk_score}%</Text>
          </View>
          <View style={[docStyles.statCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[docStyles.statLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>IoT Devices</Text>
            <Text style={[docStyles.statValue, { color: '#2a9d8f' }]}>{stats.online_devices} On</Text>
          </View>
        </View>

        {/* Critical Alerts Feed */}
        <Text style={[docStyles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>Recent Active Alerts</Text>
        {recentAlerts.length > 0 ? (
          <View style={docStyles.feedList}>
            {recentAlerts.map((alert: any) => (
              <View 
                key={alert.alert_id} 
                style={[
                  docStyles.feedCard, 
                  { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant },
                  alert.alert_type === 'critical' && { borderLeftColor: theme.colors.statusCritical, borderLeftWidth: 4 }
                ]}
              >
                <View style={docStyles.feedHeader}>
                  <Text style={[docStyles.feedTitle, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>
                    Bed {alert.bed_number || 'N/A'} · {alert.alert_type.toUpperCase()} WARNING
                  </Text>
                  {alert.status === 'pending' ? (
                    <TouchableOpacity 
                      style={[docStyles.ackBtn, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleAcknowledge(alert.alert_id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 8 }]}>ACK</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={docStyles.resolvedBadge}>
                      <Text style={[theme.typography.labelCaps, { color: theme.colors.statusStable, fontSize: 8 }]}>{alert.status.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={[docStyles.feedText, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={docStyles.emptyCard}>
            <CheckCircle size={20} color={theme.colors.statusStable} />
            <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, marginLeft: 8 }]}>
              All ICU ward parameters stable. No active alerts.
            </Text>
          </View>
        )}

        {/* Recent Reports */}
        <Text style={[docStyles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>Recent Diagnostic Reports</Text>
        {recentReports.length > 0 ? (
          <View style={docStyles.feedList}>
            {recentReports.map((rep: any) => (
              <TouchableOpacity 
                key={rep.report_id} 
                style={[docStyles.reportRowCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
                onPress={() => router.push('/(app)/(tabs)/reports')}
                activeOpacity={0.7}
              >
                <FileText size={16} color={theme.colors.primary} />
                <View style={docStyles.reportRowBody}>
                  <Text style={[theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>
                    {rep.report_type.toUpperCase()} Report
                  </Text>
                  <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]} numberOfLines={1}>
                    {rep.summary}
                  </Text>
                </View>
                <ChevronRight size={14} color={theme.colors.outline} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={docStyles.emptyCard}>
            <Info size={18} color={theme.colors.outline} />
            <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, marginLeft: 8 }]}>
              No reports compiled recently.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const docStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  greetTitle: {
  },
  greetSub: {
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 10,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 8.5,
    marginTop: 6,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    width: (Dimensions.get('window').width - 40) / 2,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 9.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  feedList: {
    gap: 8,
    marginBottom: 20,
  },
  feedCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedTitle: {
  },
  feedText: {
    fontSize: 12,
    lineHeight: 18,
  },
  ackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolvedBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1fcf8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  reportRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  reportRowBody: {
    flex: 1,
  },
});

