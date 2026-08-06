import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useAuthStore, usePatientStore, useAlertStore, useVitalsStore } from '../stores';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { WaveformChart } from '../components/medical/WaveformChart';
import { useTheme } from '../theme/ThemeProvider';

export const Dashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { user } = useAuthStore();
  const { patients, fetchPatients, selectPatient } = usePatientStore();
  const { activeAlerts, fetchActiveAlerts } = useAlertStore();

  useEffect(() => {
    fetchPatients();
    fetchActiveAlerts();
  }, [fetchPatients, fetchActiveAlerts]);

  // Mock stats count
  const activeVentilatorsCount = patients.filter(p => p.ventilator_status === 'active').length;
  const totalPatientsCount = patients.length;
  const criticalAlertsCount = activeAlerts.filter(a => a.alert_type === 'critical').length;

  const handleOpenFocusChart = async () => {
    const focusPatient = patients.find(p => p.bed_number === '402');
    if (focusPatient) {
      await selectPatient(focusPatient.patient_id);
      navigation.navigate('Patients', {
        screen: 'PatientDetails',
        params: { patientId: focusPatient.patient_id },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top AppBar */}
      <View style={[styles.appBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.outlineVariant + '33' }]}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={styles.avatar}
          />
          <Text style={[typography.labelCaps, { color: colors.onSurface }]}>
            {user?.name || 'Dr. Mitchell'}
          </Text>
        </View>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          ICU Intel
        </Text>
        <View style={styles.appBarRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Critical Alerts Banner */}
        {criticalAlertsCount > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: colors.statusCritical }]}>
            <View style={styles.alertBannerTextContainer}>
              <Text style={[typography.labelCaps, { color: '#ffffff', fontWeight: 'bold' }]}>
                CRITICAL WARNING: {activeAlerts[0]?.message}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.alertBannerButton}
              onPress={() => navigation.navigate('Alerts')}
            >
              <Text style={[typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bento Grid Stats */}
        <View style={styles.bentoGrid}>
          {/* Stat 1: Active Ventilators */}
          <Card variant="neumorphic" style={styles.bentoCard}>
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>Active Ventilators</Text>
            <Text style={[typography.statsXl, { color: colors.primary, marginTop: 8 }]}>
              {activeVentilatorsCount}<Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>/{totalPatientsCount || 30}</Text>
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: colors.primary, 
                    width: `${totalPatientsCount > 0 ? (activeVentilatorsCount / totalPatientsCount) * 100 : 80}%` 
                  }
                ]} 
              />
            </View>
          </Card>

          {/* Stat 2: Active Alerts */}
          <Card variant="neumorphic" style={[styles.bentoCard, { borderLeftWidth: 4, borderLeftColor: colors.statusCritical }]}>
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>Active Alerts</Text>
            <Text style={[typography.statsXl, { color: colors.statusCritical, marginTop: 8 }]}>
              {activeAlerts.length} <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, fontWeight: 'normal' }}>Critical</Text>
            </Text>
          </Card>

          {/* Stat 3: System Status */}
          <Card variant="neumorphic" style={[styles.bentoCard, { borderLeftWidth: 4, borderLeftColor: colors.statusStable }]}>
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>System Status</Text>
            <Text style={[typography.statsXl, { color: colors.statusStable, marginTop: 8, fontSize: 32 }]}>
              Optimal
            </Text>
          </Card>
        </View>

        {/* Focus Waveform Monitor (Room 402) */}
        <Card variant="glass" style={styles.focusMonitor}>
          <View style={styles.focusHeader}>
            <View>
              <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>Focus: Bed 402</Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>John Doe - 58M</Text>
            </View>
            <Badge type="critical" label="High Risk" />
          </View>

          {/* Live ECG wave */}
          <View style={styles.waveSection}>
            <View style={styles.waveHeader}>
              <Text style={[typography.labelCaps, { color: colors.primary }]}>ECG</Text>
              <Text style={[typography.headlineLgMobile, { color: colors.statusCritical, fontWeight: 'bold' }]}>
                140 <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>BPM</Text>
              </Text>
            </View>
            <WaveformChart type="ecg" />
          </View>

          {/* Live SpO2 wave */}
          <View style={styles.waveSection}>
            <View style={styles.waveHeader}>
              <Text style={[typography.labelCaps, { color: colors.primary }]}>SPO2</Text>
              <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
                92 <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>%</Text>
              </Text>
            </View>
            <WaveformChart type="spo2" />
          </View>

          <TouchableOpacity 
            style={[styles.fullChartButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenFocusChart}
          >
            <Text style={[typography.labelCaps, { color: '#ffffff' }]}>Open Full Chart</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    elevation: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  appBarRight: {
    width: 36, // Balance layout
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
  },
  alertBannerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  alertBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bentoGrid: {
    gap: 16,
    marginBottom: 24,
  },
  bentoCard: {
    minHeight: 100,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  focusMonitor: {
    padding: 16,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 12,
    marginBottom: 16,
  },
  waveSection: {
    marginBottom: 16,
  },
  waveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  fullChartButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});
