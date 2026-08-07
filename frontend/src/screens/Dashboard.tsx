import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Search, Pause, Shield, Bell, Activity, Play, Activity as ActiveIcon } from 'lucide-react-native';
import { usePatientStore, useAlertStore } from '../stores';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

export const Dashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { patients, selectPatient, fetchPatients } = usePatientStore();
  const { fetchActiveAlerts } = useAlertStore();
  const [isFrozen, setIsFrozen] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    fetchPatients();
    fetchActiveAlerts();
  }, [fetchPatients, fetchActiveAlerts]);

  const handleSelectPatient = async () => {
    // Find default patient (John Doe / Bed 04)
    const focusPatient = patients.find(p => p.name.includes('John Doe') || p.bed_number === '04');
    if (focusPatient) {
      await selectPatient(focusPatient.patient_id);
      navigation.navigate('Patients', {
        screen: 'PatientDetails',
        params: { patientId: focusPatient.patient_id },
      });
    }
  };

  const handleSelectRoomPatient = async (bedNumber: string) => {
    // Bed numbers in mock data might be 04 or 4, check both
    const formattedBed = bedNumber.replace(/^0+/, '');
    const p = patients.find(pat => pat.bed_number === bedNumber || pat.bed_number === formattedBed);
    if (p) {
      await selectPatient(p.patient_id);
      navigation.navigate('Patients', {
        screen: 'PatientDetails',
        params: { patientId: p.patient_id },
      });
    } else {
      Alert.alert('No Telemetry', `Bed ${bedNumber} has no active device telemetry assigned.`);
    }
  };

  const dashboardContent = (
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
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop ? styles.desktopPadding : null]} showsVerticalScrollIndicator={false}>
        
        {/* Critical Alerts Banner */}
        <View style={styles.bannerContainer}>
          <View style={[styles.banner, { backgroundColor: colors.statusCritical }]}>
            <View style={styles.bannerLeft}>
              <Bell size={18} color="#FFFFFF" style={styles.bannerIcon} />
              <Text style={[typography.labelCaps, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                CRITICAL ALERT: ROOM 402
              </Text>
            </View>
            <Text style={[typography.bodySm, { color: '#FFFFFF', flex: 1, marginHorizontal: 12 }]}>
              Patient BP Drop - Immediate Review
            </Text>
            <TouchableOpacity 
              style={styles.bannerBtn} 
              onPress={handleSelectPatient}
            >
              <Text style={[typography.labelCaps, { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }]}>
                VIEW DETAILS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Bento Grid */}
        <View style={styles.bentoStatsGrid}>
          {/* Stat 1 */}
          <Card variant="neumorphic" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Activity size={18} color={colors.primary} />
              <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
                ACTIVE VENTILATORS
              </Text>
            </View>
            <Text style={[typography.statsXl, { color: colors.primary, marginTop: 12 }]}>
              24<Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>/30</Text>
            </Text>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceContainer }]}>
              <View style={[styles.progressBarFill, { width: '80%', backgroundColor: colors.primary }]} />
            </View>
          </Card>

          {/* Stat 2 */}
          <Card variant="neumorphic" style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: colors.statusCritical }]}>
            <View style={styles.statHeader}>
              <Bell size={18} color={colors.statusCritical} />
              <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
                ALERTS
              </Text>
            </View>
            <Text style={[typography.statsXl, { color: colors.statusCritical, marginTop: 12 }]}>
              3 <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontWeight: 'normal' }]}>Critical</Text>
            </Text>
            <View style={styles.badgesRow}>
              <View style={[styles.miniChip, { backgroundColor: colors.statusCritical + '1A' }]}>
                <Text style={[styles.miniChipText, { color: colors.statusCritical }]}>Rm 402</Text>
              </View>
              <View style={[styles.miniChip, { backgroundColor: colors.statusCritical + '1A' }]}>
                <Text style={[styles.miniChipText, { color: colors.statusCritical }]}>Rm 415</Text>
              </View>
              <View style={[styles.miniChip, { backgroundColor: colors.statusCritical + '1A' }]}>
                <Text style={[styles.miniChipText, { color: colors.statusCritical }]}>Rm 422</Text>
              </View>
            </View>
          </Card>

          {/* Stat 3 */}
          <Card variant="neumorphic" style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: colors.statusStable }]}>
            <View style={styles.statHeader}>
              <Shield size={18} color={colors.statusStable} />
              <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
                SYSTEM STATUS
              </Text>
            </View>
            <Text style={[typography.statsXl, { color: colors.statusStable, marginTop: 12 }]}>
              Optimal
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              All AI predictions operational
            </Text>
          </Card>
        </View>

        {/* Live Unit Overview & Critical Patient Split */}
        <View style={isDesktop ? styles.splitGridRow : styles.stackGridCol}>
          
          {/* Live Unit Overview (Glassmorphic) */}
          <Card variant="glass" style={isDesktop ? styles.overviewGridCol : styles.fullWidth}>
            <View style={styles.overviewHeader}>
              <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: '700' }]}>
                Live Unit Overview
              </Text>
              <View style={styles.vitalsStatusRow}>
                <View style={[styles.pillBadge, { backgroundColor: colors.statusCritical }]}>
                  <Text style={styles.pillBadgeText}>1 Critical</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: colors.statusStable }]}>
                  <Text style={styles.pillBadgeText}>11 Stable</Text>
                </View>
              </View>
            </View>

            <View style={styles.roomsGrid}>
              {/* Critical Room card */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => handleSelectRoomPatient('04')}
                style={[styles.roomCard, { borderColor: colors.statusCritical + '80', backgroundColor: colors.surface + '80' }]}
              >
                <View style={[styles.roomSideBar, { backgroundColor: colors.statusCritical }]} />
                <View style={styles.roomContent}>
                  <View style={styles.roomHeaderRow}>
                    <Text style={[styles.roomBedNum, { color: colors.statusCritical }]}>Rm 04</Text>
                    <Bell size={13} color={colors.statusCritical} />
                  </View>
                  <Text style={[typography.bodySm, { color: colors.onSurface, fontWeight: 'bold' }]}>Doe, J.</Text>
                  <View style={[styles.roomStatusMeta, { backgroundColor: '#ffffff', borderColor: colors.outlineVariant + '33' }]}>
                    <Text style={[styles.roomStatusMetaText, { color: colors.onSurfaceVariant }]}>HR: 140</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Stable Room cards */}
              {[
                { bed: '03', name: 'Smith, A.', hr: '75' },
                { bed: '05', name: 'Johnson, M.', hr: '82' },
                { bed: '06', name: 'Williams, R.', hr: '68' },
                { bed: '07', name: 'Brown, T.', hr: '72' },
                { bed: '08', name: 'Davis, L.', hr: '80' },
              ].map((room) => (
                <TouchableOpacity 
                  key={room.bed}
                  activeOpacity={0.9} 
                  onPress={() => handleSelectRoomPatient(room.bed)}
                  style={[styles.roomCard, { borderColor: colors.outlineVariant + '4D', backgroundColor: colors.surface + '80' }]}
                >
                  <View style={[styles.roomSideBar, { backgroundColor: colors.statusStable }]} />
                  <View style={styles.roomContent}>
                    <View style={styles.roomHeaderRow}>
                      <Text style={[styles.roomBedNum, { color: colors.onSurfaceVariant }]}>Rm {room.bed}</Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.onSurface }]}>{room.name}</Text>
                    <View style={[styles.roomStatusMeta, { backgroundColor: '#ffffff', borderColor: colors.outlineVariant + '33' }]}>
                      <Text style={[styles.roomStatusMetaText, { color: colors.onSurfaceVariant }]}>HR: {room.hr}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Empty Rooms */}
              {['09', '10'].map((bed) => (
                <View 
                  key={bed}
                  style={[styles.roomCard, { borderColor: colors.outlineVariant + '26', backgroundColor: colors.surface + '33', opacity: 0.5 }]}
                >
                  <View style={styles.roomContent}>
                    <Text style={[styles.roomBedNum, { color: colors.onSurfaceVariant }]}>Rm {bed}</Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 4 }]}>Empty</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Real-time Vitals mini-charts (Focus Card) */}
          <Card variant="neumorphic" style={isDesktop ? styles.focusPatientCard : styles.fullWidth}>
            <View style={styles.focusHeader}>
              <View>
                <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>Focus: Rm 402</Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>John Doe - 58M</Text>
              </View>
              <Bell size={18} color={colors.statusCritical} />
            </View>

            {/* ECG wave */}
            <View style={styles.vitalsWaveBlock}>
              <View style={styles.waveLabelRow}>
                <Text style={[typography.labelCaps, { color: colors.primary }]}>ECG</Text>
                <Text style={[typography.headlineLgMobile, { color: colors.statusCritical, fontWeight: 'bold' }]}>
                  140 <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontWeight: 'normal' }]}>bpm</Text>
                </Text>
              </View>
              <View style={[styles.waveChartContainer, { backgroundColor: '#FFFFFF', borderColor: colors.outlineVariant + '33' }]}>
                <Svg width="100%" height="80" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <Path
                    d="M0,50 L40,50 L45,30 L55,90 L65,10 L75,70 L80,50 L120,50 L125,30 L135,90 L145,10 L155,70 L160,50 L200,50 L205,30 L215,90 L225,10 L235,70 L240,50 L280,50 L285,30 L295,90 L305,10 L315,70 L320,50 L360,50 L365,30 L375,90 L385,10 L395,70 L400,50"
                    fill="none"
                    stroke={colors.statusCritical}
                    strokeWidth="2"
                  />
                </Svg>
              </View>
            </View>

            {/* SpO2 wave */}
            <View style={styles.vitalsWaveBlock}>
              <View style={styles.waveLabelRow}>
                <Text style={[typography.labelCaps, { color: colors.primary }]}>SpO2</Text>
                <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
                  92 <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontWeight: 'normal' }]}>%</Text>
                </Text>
              </View>
              <View style={[styles.waveChartContainer, { backgroundColor: '#FFFFFF', borderColor: colors.outlineVariant + '33' }]}>
                <Svg width="100%" height="80" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <Path
                    d="M0,70 Q20,70 30,40 T60,70 Q80,70 90,40 T120,70 Q140,70 150,40 T180,70 Q200,70 210,40 T240,70 Q260,70 270,40 T300,70 Q320,70 330,40 T360,70 Q380,70 390,40 T400,70"
                    fill="none"
                    stroke={colors.statusStable}
                    strokeWidth="2"
                  />
                </Svg>
              </View>
            </View>

            {/* Quick action buttons row */}
            <View style={styles.vitalsBtnContainer}>
              <TouchableOpacity
                style={[
                  styles.waveformBtn,
                  isFrozen ? { backgroundColor: colors.statusCritical, borderColor: colors.statusCritical } : { borderColor: colors.outlineVariant },
                ]}
                onPress={() => setIsFrozen(!isFrozen)}
                activeOpacity={0.8}
              >
                {isFrozen ? (
                  <>
                    <Play size={14} color="#FFFFFF" style={styles.btnIconSpacing} />
                    <Text style={[typography.labelCaps, { color: '#FFFFFF', fontWeight: 'bold' }]}>UNFREEZE</Text>
                  </>
                ) : (
                  <>
                    <Pause size={14} color={colors.primary} style={styles.btnIconSpacing} />
                    <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold' }]}>FREEZE WAVE</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fullChartBtn, { backgroundColor: colors.primary }]}
                onPress={handleSelectPatient}
                activeOpacity={0.8}
              >
                <Text style={[typography.labelCaps, { color: colors.onPrimary, fontWeight: 'bold' }]}>FULL CHART</Text>
              </TouchableOpacity>
            </View>
          </Card>
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
            style={[styles.sidebarLink, styles.sidebarLinkActive, { backgroundColor: colors.secondaryContainer + '33' }]}
            activeOpacity={0.8}
          >
            <View style={[styles.activeIndicatorBar, { backgroundColor: colors.primary }]} />
            <ActiveIcon size={20} color={colors.primary} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Patients')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
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
        <View style={styles.flex1}>{dashboardContent}</View>
      </View>
    );
  }

  return dashboardContent;
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  desktopPadding: {
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  bannerContainer: {
    width: '100%',
    marginBottom: 24,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: 8,
  },
  bannerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bentoStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    padding: 20,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  miniChipText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  splitGridRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stackGridCol: {
    flexDirection: 'column',
    gap: 24,
  },
  overviewGridCol: {
    flex: 1.8,
  },
  focusPatientCard: {
    flex: 1.2,
    padding: 20,
  },
  fullWidth: {
    width: '100%',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vitalsStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomCard: {
    width: '48%',
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  roomSideBar: {
    width: 4,
    height: '100%',
  },
  roomContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomBedNum: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roomStatusMeta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roomStatusMetaText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 12,
    marginBottom: 16,
  },
  vitalsWaveBlock: {
    marginBottom: 20,
  },
  waveLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  waveChartContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  vitalsBtnContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
  },
  waveformBtn: {
    flex: 1.2,
    flexDirection: 'row',
    height: 40,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullChartBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconSpacing: {
    marginRight: 6,
  },
});

