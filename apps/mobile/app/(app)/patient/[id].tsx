import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, Dimensions 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePatientDetailsQuery, useAIPredictionQuery } from '@mednova/hooks';
import { Info, Heart, AlertTriangle } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: patient, isLoading: loadingPatient } = usePatientDetailsQuery(id);
  const { data: prediction, isLoading: loadingPrediction } = useAIPredictionQuery(id);

  if (loadingPatient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#8f9091' }}>Patient details not found.</Text>
      </View>
    );
  }

  const riskLabel = prediction ? `${prediction.risk_level.toUpperCase()} (${prediction.risk_score}%)` : 'NORMAL (12%)';
  const riskColor = prediction?.risk_level === 'critical' || prediction?.risk_level === 'high' ? '#d90429' : '#2a9d8f';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Patient Name card */}
      <View style={styles.patientHeader}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientMeta}>
          Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} years old
        </Text>
      </View>

      {/* Real-time Simulated Waveforms */}
      <Text style={styles.sectionTitle}>Real-time Waveforms</Text>
      <View style={styles.waveformCard}>
        <View style={styles.waveformHeader}>
          <Text style={styles.waveformTitle}>ECG (BPM)</Text>
          <Text style={[styles.waveformValue, { color: '#d90429' }]}>140</Text>
        </View>
        <Svg height="60" width={Dimensions.get('window').width - 64} style={styles.svg}>
          <Path 
            d="M 0 30 L 50 30 L 60 10 L 70 50 L 80 30 L 150 30 L 160 10 L 170 50 L 180 30 L 250 30 L 260 10 L 270 50 L 280 30" 
            fill="none" 
            stroke="#d90429" 
            strokeWidth="2" 
          />
        </Svg>

        <View style={[styles.waveformHeader, { marginTop: 16 }]}>
          <Text style={styles.waveformTitle}>SpO2 (%)</Text>
          <Text style={[styles.waveformValue, { color: '#66fcf1' }]}>92</Text>
        </View>
        <Svg height="60" width={Dimensions.get('window').width - 64} style={styles.svg}>
          <Path 
            d="M 0 30 Q 15 10 30 30 T 60 30 T 90 30 T 120 30 T 150 30 T 180 30 T 210 30 T 240 30" 
            fill="none" 
            stroke="#66fcf1" 
            strokeWidth="2" 
          />
        </Svg>
      </View>

      {/* Ventilator Setting Details */}
      <Text style={styles.sectionTitle}>Ventilator Configuration</Text>
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>Tidal Volume</Text>
          <Text style={styles.gridVal}>500 ml</Text>
        </View>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>PEEP Pressure</Text>
          <Text style={styles.gridVal}>8 cmH2O</Text>
        </View>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>Respiratory Rate</Text>
          <Text style={styles.gridVal}>14 bpm</Text>
        </View>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>FiO2 Setting</Text>
          <Text style={styles.gridVal}>40 %</Text>
        </View>
      </View>

      {/* AI Risk Score predictions */}
      <Text style={styles.sectionTitle}>AI Forecast Analysis</Text>
      <View style={[styles.forecastCard, { borderLeftColor: riskColor }]}>
        <View style={styles.forecastHeader}>
          <Text style={styles.forecastTitle}>Weaning Failure Risk</Text>
          <Text style={[styles.forecastRisk, { color: riskColor }]}>{riskLabel}</Text>
        </View>
        <View style={styles.forecastBody}>
          <Info size={16} color="#66fcf1" style={{ marginTop: 2 }} />
          <Text style={styles.forecastText}>
            {prediction?.recommendation || 'Ventilator pressure trends indicate high probability of successful weaning within 24 hours. Vital parameters are stable.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0c10',
  },
  patientHeader: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  patientMeta: {
    fontSize: 12,
    color: '#8f9091',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  waveformCard: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  waveformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  waveformTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8f9091',
  },
  waveformValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  svg: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    width: (Dimensions.get('window').width - 44) / 2,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8f9091',
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  forecastCard: {
    backgroundColor: '#1f2833',
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  forecastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  forecastRisk: {
    fontSize: 12,
    fontWeight: '800',
  },
  forecastBody: {
    flexDirection: 'row',
    gap: 8,
  },
  forecastText: {
    flex: 1,
    fontSize: 12,
    color: '#c5c6c7',
    lineHeight: 18,
  },
});
