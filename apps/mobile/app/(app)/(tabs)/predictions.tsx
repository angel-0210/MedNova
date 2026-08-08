import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
  TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  useDoctorPatientsQuery, useLatestDoctorPredictionQuery,
  usePredictionHistoryQuery, useRefreshPredictionMutation
} from '@mednova/hooks';
import { Brain, Sparkles, RefreshCw, ChevronRight, Activity, TrendingUp, Info } from 'lucide-react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { FOLLOW_UP_LABELS } from '@mednova/constants';
import { theme } from '../../../constants/theme';

export default function PredictionsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { data: patients = [], isLoading: loadingPatients } = useDoctorPatientsQuery();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Set default selected patient or route patientId
  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    } else if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].patient_id);
    }
  }, [patients, patientId]);

  const { data: prediction, isLoading: loadingPred, refetch: refetchLatest } = useLatestDoctorPredictionQuery(selectedPatientId || '');
  const { data: history = [], isLoading: loadingHist, refetch: refetchHistory } = usePredictionHistoryQuery(selectedPatientId || '');
  const refreshMutation = useRefreshPredictionMutation();

  const handleRefresh = async () => {
    if (!selectedPatientId) return;
    try {
      await refreshMutation.mutateAsync(selectedPatientId);
      Alert.alert('AI Prediction', 'Risk metrics computed and refreshed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to refresh prediction.');
    }
  };

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId);

  if (loadingPatients) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const riskColor = prediction?.risk_level === 'critical' || prediction?.risk_level === 'high' 
    ? theme.colors.statusCritical 
    : theme.colors.statusStable;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Brain size={24} color={theme.colors.primary} />
          <Text style={[styles.title, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>
            AI Forecast Engine
          </Text>
        </View>

        {/* Patient Selector */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Select Patient</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientSelectorRow}>
          {patients.map(p => (
            <TouchableOpacity
              key={p.patient_id}
              style={[
                styles.patientPill,
                selectedPatientId === p.patient_id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}
              onPress={() => setSelectedPatientId(p.patient_id)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.patientPillText,
                selectedPatientId === p.patient_id && { color: '#ffffff', fontWeight: '700' }
              ]}>
                Bed {p.bed_number || 'N/A'} · {p.name.split(' ').pop()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPatientId ? (
          loadingPred ? (
            <View style={styles.centerPred}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              
              {/* Risk Summary Card */}
              <View style={[styles.mainCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.patientLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Latest Analysis</Text>
                    <Text style={[styles.patientName, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>
                      {selectedPatient?.name} (Bed {selectedPatient?.bed_number})
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.refreshBtn, { backgroundColor: theme.colors.surface }]}
                    onPress={handleRefresh}
                    disabled={refreshMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                {prediction ? (
                  <View style={styles.predMetrics}>
                    <View style={styles.scoreRow}>
                      <View>
                        <Text style={[styles.riskTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>Weaning Failure Risk</Text>
                        <Text style={[styles.riskLevel, theme.typography.labelCaps, { color: riskColor, fontWeight: '800' }]}>
                          {prediction.risk_level.toUpperCase()} RISK
                        </Text>
                      </View>
                      <Text style={[styles.riskScore, { color: riskColor }]}>
                        {prediction.risk_score}%
                      </Text>
                    </View>

                    {/* Horizontal progress bar */}
                    <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceContainer }]}>
                      <View style={[styles.progressFill, { width: `${prediction.risk_score}%`, backgroundColor: riskColor }]} />
                    </View>

                    {/* Secondary Metrics */}
                    <View style={styles.secondaryGrid}>
                      <View style={[styles.metricBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={styles.metricVal}>{(100 - prediction.risk_score)}%</Text>
                        <Text style={styles.metricLbl}>Weaning Success</Text>
                      </View>
                      <View style={[styles.metricBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={styles.metricVal}>{prediction.risk_score > 70 ? 'High' : 'Low'}</Text>
                        <Text style={styles.metricLbl}>ARDS Indicator</Text>
                      </View>
                      <View style={[styles.metricBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={styles.metricVal}>{prediction.risk_score > 50 ? 'Postponed' : 'Ready'}</Text>
                        <Text style={styles.metricLbl}>Extubation Readiness</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noData}>
                    <Info size={24} color={theme.colors.outline} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>
                      No AI prediction available. Tap refresh to compute risk.
                    </Text>
                  </View>
                )}
              </View>

              {/* Recommendation Card */}
              {prediction && (
                <View style={[styles.recommendationCard, { backgroundColor: theme.colors.primaryContainer }]}>
                  <View style={styles.recHeader}>
                    <Sparkles size={16} color={theme.colors.secondaryContainer} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.secondaryContainer, fontWeight: '800' }]}>Recommendation</Text>
                  </View>
                  <Text style={styles.recText}>
                    {prediction.recommendation}
                  </Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLbl}>Model Confidence Margin:</Text>
                    <Text style={styles.confidenceVal}>{Math.round(prediction.confidence * 100)}%</Text>
                  </View>
                  {/* Follow-up is recorded in the admin panel; shown here so the bedside
                      view says whether anyone has acted on this result. */}
                  <View style={styles.followUpRow}>
                    <Text style={styles.confidenceLbl}>Follow-up:</Text>
                    <Text style={styles.confidenceVal}>
                      {FOLLOW_UP_LABELS[prediction.follow_up_status] ?? 'Pending'}
                    </Text>
                  </View>
                  {!!prediction.clinician_note && (
                    <Text style={styles.clinicianNote}>{prediction.clinician_note}</Text>
                  )}
                </View>
              )}

              {/* Historical Trend Charts */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>Historical Risk Trend</Text>
              <View style={[styles.chartCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                {history.length > 1 ? (
                  <View>
                    <View style={styles.chartTitleRow}>
                      <TrendingUp size={16} color={theme.colors.primary} />
                      <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '700' }]}>Mortality Risk over time</Text>
                    </View>
                    <View style={styles.chartWrapper}>
                      <Svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <Line x1="0" y1="20" x2="300" y2="20" stroke="#eeeeee" strokeWidth="1" />
                        <Line x1="0" y1="50" x2="300" y2="50" stroke="#eeeeee" strokeWidth="1" />
                        <Line x1="0" y1="80" x2="300" y2="80" stroke="#eeeeee" strokeWidth="1" />
                        
                        {/* Dynamic Path */}
                        <Path
                          d={(() => {
                            const points = history.slice(0, 8).reverse().map((h, i) => {
                              const x = (i / 7) * 300;
                              const y = 100 - h.risk_score;
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ');
                            return points;
                          })()}
                          fill="none"
                          stroke={theme.colors.primary}
                          strokeWidth="3"
                        />
                      </Svg>
                    </View>
                    <View style={styles.chartLabels}>
                      <Text style={styles.chartLabelText}>Older</Text>
                      <Text style={styles.chartLabelText}>Latest</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noHistory}>
                    <Activity size={18} color={theme.colors.outline} />
                    <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>
                      Insufficient historical logs to draw risk trends.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )
        ) : (
          <View style={styles.noData}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No ICU patients found to analyze.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  centerPred: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    margin: 0,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 10,
    fontWeight: '700',
  },
  patientSelectorRow: {
    gap: 8,
    marginBottom: 20,
    paddingRight: 16,
  },
  patientPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: '#ffffff',
  },
  patientPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  resultsContainer: {
    gap: 16,
  },
  mainCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 10,
    marginBottom: 12,
  },
  patientLabel: {
    fontSize: 9,
  },
  patientName: {
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predMetrics: {
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskTitle: {
  },
  riskLevel: {
    fontSize: 9,
    marginTop: 2,
  },
  riskScore: {
    fontSize: 32,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  metricLbl: {
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center',
  },
  recommendationCard: {
    borderRadius: 20,
    padding: 16,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 20,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  followUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  clinicianNote: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  confidenceLbl: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  confidenceVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  chartWrapper: {
    height: 100,
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 8,
    paddingVertical: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartLabelText: {
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
  },
  noData: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noHistory: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
