import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { usePatientStore, useAIStore, useVitalsStore } from '../stores';
import { VitalCard } from '../components/medical/VitalCard';
import { WaveformChart } from '../components/medical/WaveformChart';
import { RiskGauge } from '../components/medical/RiskGauge';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { Bell, Activity as ActiveIcon, Search, AlertCircle } from 'lucide-react-native';

export const PatientDetails: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const { colors, typography } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  
  const { selectedPatient, selectPatient, loading } = usePatientStore();
  const { predictions, fetchLatestPrediction } = useAIStore();
  const { latestVitals } = useVitalsStore();
  const { canAcknowledgeAlerts } = useRoleAccess();

  useEffect(() => {
    selectPatient(patientId);
    fetchLatestPrediction(patientId);
  }, [patientId, selectPatient, fetchLatestPrediction]);

  if (loading || !selectedPatient) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>Loading patient details...</Text>
      </View>
    );
  }

  const prediction = predictions[patientId];
  const vitals = latestVitals[patientId];

  // Dynamic telemetry thresholds
  const displaySpo2 = vitals?.spo2 ?? 92.5;
  const displayHeartRate = vitals?.heart_rate ?? 140.0;
  const displayTemp = vitals?.temperature ?? 38.2;

  const isSpo2Critical = displaySpo2 < 93;
  const isHeartRateCritical = displayHeartRate > 100 || displayHeartRate < 60;

  const detailsContent = (
    <View style={styles.flex1}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.outlineVariant + '33' }]}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={[styles.avatar, { borderColor: colors.outlineVariant }]}
          />
          <Text style={[typography.labelCaps, { color: colors.onSurface, fontWeight: 'bold' }]}>
            Dr. Sarah Mitchell
          </Text>
        </View>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          ICU Intel
        </Text>
        <TouchableOpacity style={styles.appBarIconButton} onPress={() => navigation.navigate('Patients')}>
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop ? styles.desktopPadding : null]} showsVerticalScrollIndicator={false}>
        
        {/* Main Split Grid */}
        <View style={isDesktop ? styles.splitGridRow : styles.stackGridCol}>
          
          {/* Left Column (Details & Waves) */}
          <View style={isDesktop ? styles.leftCol : styles.fullWidth}>
            
            {/* Patient Demographic Profile Card */}
            <Card variant="sterile" style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View>
                  <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700' }]}>
                    {selectedPatient.name}
                  </Text>
                  <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                    Bed {selectedPatient.bed_number || 'Unassigned'} • Ward ICU • {selectedPatient.gender} • {selectedPatient.age} yrs
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: selectedPatient.ventilator_status === 'active' ? colors.primary : colors.surfaceContainerHighest }
                ]}>
                  <Text style={[styles.statusBadgeText, { color: selectedPatient.ventilator_status === 'active' ? '#FFFFFF' : colors.primary }]}>
                    Ventilator: {selectedPatient.ventilator_status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Waveform Monitors Panel */}
            <View style={styles.wavesContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: '700' }]}>
                  Ventilator Waveforms
                </Text>
              </View>

              <View style={styles.waveformBlock}>
                <View style={styles.waveHeaderRow}>
                  <Text style={[typography.labelCaps, { color: colors.primary }]}>ECG WAVEFORM</Text>
                  <Text style={[typography.bodySm, { color: isHeartRateCritical ? colors.statusCritical : colors.primary, fontWeight: 'bold' }]}>
                    {displayHeartRate.toFixed(0)} BPM
                  </Text>
                </View>
                <WaveformChart type="ecg" color={isHeartRateCritical ? colors.statusCritical : colors.primary} />
              </View>

              <View style={styles.waveformBlock}>
                <View style={styles.waveHeaderRow}>
                  <Text style={[typography.labelCaps, { color: colors.primary }]}>SPO2 WAVEFORM</Text>
                  <Text style={[typography.bodySm, { color: isSpo2Critical ? colors.statusCritical : colors.primary, fontWeight: 'bold' }]}>
                    {displaySpo2.toFixed(1)}%
                  </Text>
                </View>
                <WaveformChart type="spo2" color={isSpo2Critical ? colors.statusCritical : colors.statusStable} />
              </View>
            </View>
          </View>

          {/* Right Column (Vitals stats, AI predictive recommendation, actions) */}
          <View style={isDesktop ? styles.rightCol : styles.fullWidth}>
            
            {/* Bento Vitals Registry grid */}
            <View style={styles.vitalsGridRow}>
              <VitalCard
                label="OXYGEN SAT"
                value={displaySpo2}
                unit="%"
                icon={<Text style={{ fontSize: 16 }}>🫁</Text>}
                minSafe={95}
                maxSafe={100}
              />
              <VitalCard
                label="HEART RATE"
                value={displayHeartRate}
                unit="BPM"
                icon={<Text style={{ fontSize: 16 }}>❤️</Text>}
                minSafe={60}
                maxSafe={100}
              />
            </View>

            <View style={styles.vitalsGridRow}>
              <VitalCard
                label="TEMPERATURE"
                value={displayTemp}
                unit="°C"
                icon={<Text style={{ fontSize: 16 }}>🌡️</Text>}
                minSafe={36.0}
                maxSafe={37.5}
              />
            </View>

            {/* AI Risk Prediction & Recommendations */}
            {prediction && (
              <Card variant="glass" style={styles.predictionCard}>
                <Text style={[typography.labelCaps, { color: colors.primary, marginBottom: 16, fontWeight: 'bold' }]}>
                  AI Clinical Prediction System
                </Text>
                
                <View style={styles.riskGaugeRow}>
                  <RiskGauge score={prediction.risk_score} size={100} />
                  
                  <View style={styles.gaugeMeta}>
                    <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: '700' }]}>
                      Risk Level: {prediction.risk_level.toUpperCase()}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                      Confidence: {(prediction.confidence * 100).toFixed(0)}% • Model v2.1
                    </Text>
                  </View>
                </View>

                {prediction.recommendation && (
                  <View style={[styles.recommendBox, { backgroundColor: colors.statusCritical + '12', borderLeftColor: colors.statusCritical }]}>
                    <View style={styles.recommendHeader}>
                      <AlertCircle size={16} color={colors.statusCritical} style={styles.recommendIcon} />
                      <Text style={[typography.labelCaps, { color: colors.statusCritical, fontWeight: 'bold', fontSize: 11 }]}>
                        RECOMMENDED PROTOCOL
                      </Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.onSurface, lineHeight: 18, marginTop: 6, fontWeight: '500' }]}>
                      {prediction.recommendation}
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {/* Clinical Actions */}
            <View style={styles.actionsPanel}>
              {canAcknowledgeAlerts && (
                <TouchableOpacity
                  style={[styles.actionButtonPrimary, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('Alerts')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>Acknowledge Patient Alerts</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>

      </ScrollView>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Desktop sidebar */}
        <View style={[styles.desktopSidebar, { backgroundColor: colors.surface, borderRightColor: colors.outlineVariant + '33' }]}>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkActive, { backgroundColor: colors.secondaryContainer + '33' }]}
            activeOpacity={0.8}
          >
            <View style={[styles.activeIndicatorBar, { backgroundColor: colors.primary }]} />
            <ActiveIcon size={20} color={colors.primary} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
              Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Bell size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkBottom]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Search size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>{detailsContent}</View>
      </View>
    );
  }

  return detailsContent;
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopSidebar: {
    width: 96,
    height: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    borderRightWidth: 1,
  },
  sidebarLink: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sidebarLinkActive: {
    position: 'relative',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarLinkBottom: {
    marginTop: 'auto',
    marginBottom: 0,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  appBarIconButton: {
    padding: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  desktopPadding: {
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  splitGridRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stackGridCol: {
    flexDirection: 'column',
    gap: 20,
  },
  leftCol: {
    flex: 1.4,
    gap: 20,
  },
  rightCol: {
    flex: 1.2,
    gap: 20,
  },
  fullWidth: {
    width: '100%',
  },
  profileCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  wavesContainer: {
    marginTop: 8,
  },
  waveformBlock: {
    marginBottom: 16,
  },
  waveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  vitalsGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  riskGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  gaugeMeta: {
    flex: 1,
  },
  recommendBox: {
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendIcon: {
    marginRight: 6,
  },
  actionsPanel: {
    marginTop: 8,
  },
  actionButtonPrimary: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

