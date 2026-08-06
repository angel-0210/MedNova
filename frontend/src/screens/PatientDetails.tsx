import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePatientStore, useAIStore, useVitalsStore, useAlertStore } from '../stores';
import { VitalCard } from '../components/medical/VitalCard';
import { WaveformChart } from '../components/medical/WaveformChart';
import { RiskGauge } from '../components/medical/RiskGauge';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { useRoleAccess } from '../hooks/useRoleAccess';

export const PatientDetails: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { patientId } = route.params;
  const { colors, typography } = useTheme();
  
  const { selectedPatient, selectPatient, loading } = usePatientStore();
  const { predictions, fetchLatestPrediction } = useAIStore();
  const { latestVitals } = useVitalsStore();
  const { canAcknowledgeAlerts, canResolveAlerts } = useRoleAccess();

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

  // Default fallback vitals if no real-time telemetry has arrived yet
  const displaySpo2 = vitals?.spo2 ?? 96.5;
  const displayHeartRate = vitals?.heart_rate ?? 74.0;
  const displayTemp = vitals?.temperature ?? 36.8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card variant="sterile" style={styles.profileCard}>
          <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
            {selectedPatient.name}
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            Bed {selectedPatient.bed_number || 'Unassigned'} • Ward ICU • {selectedPatient.gender} • {selectedPatient.age} yrs
          </Text>
          <View style={styles.ventilatorStatus}>
            <Text style={[typography.labelCaps, { color: colors.primary }]}>
              Ventilator status: {selectedPatient.ventilator_status.toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Real-time Vitals Bento Grid */}
        <View style={styles.vitalsSection}>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 12 }]}>
            Live Telemetering
          </Text>
          <View style={styles.vitalsGrid}>
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
          
          <View style={styles.waveformContainer}>
            <View style={styles.waveformHeader}>
              <Text style={[typography.labelCaps, { color: colors.primary }]}>ECG WAVE</Text>
            </View>
            <WaveformChart type="ecg" />
          </View>

          <View style={styles.vitalsGrid}>
            <VitalCard
              label="TEMPERATURE"
              value={displayTemp}
              unit="°C"
              icon={<Text style={{ fontSize: 16 }}>🌡️</Text>}
              minSafe={36.0}
              maxSafe={37.5}
            />
          </View>
        </View>

        {/* AI Prediction & Recommendations */}
        {prediction && (
          <Card variant="glass" style={styles.aiPredictionCard}>
            <Text style={[typography.labelCaps, { color: colors.primary, marginBottom: 16 }]}>
              AI Clinical Risk Prediction
            </Text>
            
            <View style={styles.predictionRow}>
              <RiskGauge score={prediction.risk_score} size={100} />
              
              <View style={styles.predictionDetails}>
                <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
                  Risk Status: {prediction.risk_level.toUpperCase()}
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                  Confidence Index: {(prediction.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>

            {prediction.recommendation && (
              <View style={[styles.recommendationContainer, { borderLeftColor: colors.statusCritical }]}>
                <Text style={[typography.bodySm, { color: colors.onSurface, fontStyle: 'italic' }]}>
                  "{prediction.recommendation}"
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Actions Gate */}
        <View style={styles.actionsContainer}>
          {canAcknowledgeAlerts && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Alerts')}
            >
              <Text style={[typography.labelCaps, { color: '#ffffff' }]}>Acknowledge Active Alerts</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    padding: 16,
    marginBottom: 20,
  },
  ventilatorStatus: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#eeeeee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vitalsSection: {
    marginBottom: 20,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  waveformContainer: {
    marginBottom: 12,
  },
  waveformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiPredictionCard: {
    padding: 16,
    marginBottom: 20,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  predictionDetails: {
    flex: 1,
  },
  recommendationContainer: {
    marginTop: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});
