import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { Search, Pause, Camera, TrendingUp } from 'lucide-react-native';
import { useAuthStore, usePatientStore } from '../stores';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

const { width } = Dimensions.get('window');

export const Dashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { user } = useAuthStore();
  const { patients, selectPatient } = usePatientStore();
  const [isFrozen, setIsFrozen] = useState(false);

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

  const handleCaptureEvent = () => {
    Alert.alert('Event Captured', 'Waveform screenshot and telemetry logs saved to clinical files.');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
      {/* Top App Bar Header */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={styles.avatar}
          />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>ICU Intel</Text>
        </View>
        
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Patient Header Card */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleSelectPatient}>
          <View style={styles.patientInfoBlock}>
            <View style={styles.patientNameRow}>
              <Text style={[styles.patientTitleName, { color: colors.primary }]}>
                Patient: John Doe
              </Text>
              <View style={[styles.stableChip, { backgroundColor: colors.primary }]}>
                <Text style={styles.stableChipText}>STABLE</Text>
              </View>
            </View>
            <Text style={styles.patientSubtitle}>
              Bed 04 - ICU A
            </Text>

            {/* Quick Action Buttons */}
            <View style={styles.actionsRow}>
              {/* Freeze Waveform */}
              <TouchableOpacity 
                style={[
                  styles.historyButton, 
                  isFrozen ? { backgroundColor: '#FFA515', borderColor: '#FFA515' } : null
                ]} 
                onPress={() => setIsFrozen(!isFrozen)}
                activeOpacity={0.8}
              >
                <Pause size={16} color={isFrozen ? '#FFFFFF' : '#1E293B'} style={styles.btnIcon} />
                <Text style={[styles.historyButtonText, isFrozen ? { color: '#FFFFFF' } : null]}>
                  {isFrozen ? 'UNFREEZE WAVE' : 'FREEZE WAVEFORM'}
                </Text>
              </TouchableOpacity>

              {/* Capture Event */}
              <TouchableOpacity 
                style={[styles.captureButton, { backgroundColor: colors.primary }]} 
                onPress={handleCaptureEvent}
                activeOpacity={0.8}
              >
                <Camera size={16} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.captureButtonText}>Capture Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Real-time Waveforms Monitor Panel (Dark theme) */}
        <View style={styles.monitorPanel}>
          {/* Waveform 1: Pressure */}
          <View style={styles.waveformItem}>
            <Text style={styles.waveLabel}>Pressure (cmH2O)</Text>
            <View style={styles.waveContainer}>
              <Svg width={width - 56} height={65} viewBox="0 0 320 65">
                {/* Grid Lines */}
                <Line x1="10" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                <Line x1="10" y1="45" x2="310" y2="45" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                
                {/* Pressure Waveform Curve */}
                <Path
                  d="M 10,48 L 22,15 L 47,15 L 59,48 L 81,48 L 93,15 L 118,15 L 130,48 L 152,48 L 164,15 L 189,15 L 201,48 L 223,48 L 235,15 L 260,15 L 272,48 L 294,48 L 305,15"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>
            </View>
          </View>

          {/* Waveform 2: Flow (with AI Insight highlighted label) */}
          <View style={styles.waveformItem}>
            <View style={styles.flowLabelContainer}>
              <Text style={styles.waveLabel}>Flow (L/min) </Text>
              <View style={styles.asynchronyLabel}>
                <Text style={styles.asynchronyLabelText}>AI Insight: Slight Asynchrony</Text>
              </View>
            </View>
            <View style={styles.waveContainer}>
              <Svg width={width - 56} height={65} viewBox="0 0 320 65">
                {/* Grid Lines */}
                <Line x1="10" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                <Line x1="10" y1="45" x2="310" y2="45" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />

                {/* Flow Waveform Curve (irregular exhalation peak in orange) */}
                <Path
                  d="M 10,35 Q 25,12 45,35 C 55,45 62,45 72,35 C 82,35 92,35 102,35 Q 117,12 137,35 C 147,45 154,45 164,35 C 174,35 184,35 194,35 Q 209,12 229,35 C 239,48 244,48 254,35 C 264,35 274,35 284,35"
                  stroke="#FFA515"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>
            </View>
          </View>

          {/* Waveform 3: Volume */}
          <View style={[styles.waveformItem, styles.lastWaveformItem]}>
            <Text style={styles.waveLabel}>Volume (mL)</Text>
            <View style={styles.waveContainer}>
              <Svg width={width - 56} height={65} viewBox="0 0 320 65">
                {/* Grid Lines */}
                <Line x1="10" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />
                <Line x1="10" y1="45" x2="310" y2="45" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3,3" />

                {/* Volume Waveform Curve */}
                <Path
                  d="M 10,48 Q 35,15 60,48 T 110,48 Q 135,15 160,48 T 210,48 Q 235,15 260,48 T 310,48"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  fill="none"
                />
              </Svg>
            </View>
          </View>

          {/* Grid Parameters Row */}
          <View style={styles.paramGridRow}>
            {/* FiO2 Card */}
            <View style={styles.paramCard}>
              <Text style={styles.paramLabel}>FiO2 (%)</Text>
              <View style={styles.paramValRow}>
                <Text style={styles.paramValue}>40</Text>
                <View style={styles.indicatorContainer}>
                  <Text style={styles.indicatorText}>↑ 2%</Text>
                </View>
              </View>
              <Text style={styles.paramSubtitle}>Set: 40</Text>
            </View>

            {/* PEEP Card */}
            <View style={styles.paramCard}>
              <Text style={styles.paramLabel}>PEEP (cmH2O)</Text>
              <View style={styles.paramValRow}>
                <Text style={styles.paramValue}>5.0</Text>
                <Text style={styles.dashIndicator}>-</Text>
              </View>
              <Text style={styles.paramSubtitle}>Set: 5.0</Text>
            </View>

            {/* VTe Card */}
            <View style={[styles.paramCard, styles.lastParamCard]}>
              <Text style={styles.paramLabel}>VTe (mL)</Text>
              <View style={styles.paramValRow}>
                <Text style={styles.paramValue}>410</Text>
                <Text style={styles.dashIndicator}>-</Text>
              </View>
              <Text style={styles.paramSubtitle}>Target: 400</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  appBarIconButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  // Patient Info Header Card
  patientInfoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: 'rgba(0, 10, 36, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  patientNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientTitleName: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  stableChip: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  stableChipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  patientSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  historyButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  captureButton: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
  // Real-time Waveforms Monitor Panel (Dark theme)
  monitorPanel: {
    backgroundColor: '#050B1A', // Dark clinical monitor background
    borderRadius: 20,
    padding: 16,
    shadowColor: 'rgba(0, 10, 36, 0.15)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  waveformItem: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 12,
  },
  lastWaveformItem: {
    marginBottom: 18,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  waveLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  flowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  asynchronyLabel: {
    borderColor: '#FFA515',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  asynchronyLabelText: {
    color: '#FFA515',
    fontSize: 9,
    fontWeight: '700',
  },
  waveContainer: {
    alignItems: 'center',
  },
  // Bottom Parameters Grid
  paramGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0A1121', // Darker base for panel metrics
    borderRadius: 14,
    padding: 12,
  },
  paramCard: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 4,
  },
  lastParamCard: {
    borderRightWidth: 0,
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.3,
  },
  paramValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  paramValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  indicatorContainer: {
    backgroundColor: 'rgba(255, 165, 21, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
  },
  indicatorText: {
    color: '#FFA515',
    fontSize: 9,
    fontWeight: '700',
  },
  dashIndicator: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '700',
  },
  paramSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
});
