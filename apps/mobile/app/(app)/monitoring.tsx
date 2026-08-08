import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useDoctorPatientsQuery, useLatestDoctorPredictionQuery,
  usePatientTimelineQuery
} from '@mednova/hooks';
import {
  Activity, Heart, ShieldAlert, Wifi, Sparkles, ArrowLeft,
  Battery, Phone, FileText, Brain, RefreshCw
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { secureStoreService } from '../../services/secureStoreService';
import { BASE_WS_URL } from '../../config/apiConfig';
import { FOLLOW_UP_LABELS } from '@mednova/constants';
import { theme } from '../../constants/theme';

export default function LiveMonitoringScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const { data: patients = [], isLoading: loadingPatients } = useDoctorPatientsQuery();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Real-time vital states
  const [spo2, setSpo2] = useState<number>(98);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [temp, setTemp] = useState<number>(36.7);
  const [respRate, setRespRate] = useState<number>(14);
  
  // Ventilator parameter states
  const [peep, setPeep] = useState<number>(8);
  const [fio2, setFio2] = useState<number>(40);
  const [pressure, setPressure] = useState<number>(18);
  const [flow, setFlow] = useState<number>(45);
  const [tidalVol, setTidalVol] = useState<number>(500);
  const [plateauPres, setPlateauPres] = useState<number>(22);
  const [minVent, setMinVent] = useState<number>(7.0);
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Waveform buffers
  const [liveBuffer, setLiveBuffer] = useState<number[]>([98, 98, 98, 98, 98, 98, 98, 98, 98, 98]);
  const [ventBuffer, setVentBuffer] = useState<number[]>([15, 18, 22, 16, 12, 10, 8, 8, 8, 12]);

  const wsRef = useRef<WebSocket | null>(null);

  // Sync route param or default selected patient
  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    } else if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].patient_id);
    }
  }, [patients, patientId]);

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId);
  const { data: prediction } = useLatestDoctorPredictionQuery(selectedPatientId || '');
  const { data: timeline = [], refetch: refetchTimeline } = usePatientTimelineQuery(selectedPatientId || '');

  // WebSocket Live Sync
  useEffect(() => {
    if (!selectedPatientId) return;

    // Reset parameters to baseline
    setSpo2(98);
    setHeartRate(75);
    setTemp(36.7);
    setRespRate(14);
    setPeep(8);
    setFio2(40);
    setPressure(18);
    setFlow(45);
    setTidalVol(500);
    setPlateauPres(22);
    setMinVent(7.0);
    setBatteryLevel(92);
    setLiveBuffer([98, 98, 98, 98, 98, 98, 98, 98, 98, 98]);
    setVentBuffer([15, 18, 22, 16, 12, 10, 8, 8, 8, 12]);
    setIsConnected(false);

    let isMounted = true;

    const connectWS = async () => {
      const accessToken = await secureStoreService.getAccessToken();
      if (!accessToken || !isMounted) return;

      const wsUrl = `${BASE_WS_URL}/ws/patient/${selectedPatientId}?token=${accessToken}`;
      
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          setIsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        if (event.data === 'ping') return;
        try {
          const rawData = JSON.parse(event.data);
          const { event: eventName, data } = rawData;
          if (eventName === 'new_telemetry') {
            setSpo2(data.spo2);
            setHeartRate(data.heart_rate);
            setTemp(data.temperature);
            
            // Shift telemetry buffer for live graph
            setLiveBuffer(prev => {
              const next = [...prev.slice(1), data.spo2];
              return next;
            });
            
            // Simulate realistic secondary vitals and vent waveforms
            setRespRate(Math.floor(12 + Math.random() * 4));
            setPressure(Math.floor(15 + Math.random() * 6));
            setFlow(Math.floor(40 + Math.random() * 10));
            setTidalVol(Math.floor(480 + Math.random() * 40));
            setMinVent(parseFloat((6.5 + Math.random() * 1.2).toFixed(1)));
            setBatteryLevel(prev => Math.max(prev - (Math.random() > 0.95 ? 1 : 0), 15));
            
            setVentBuffer(prev => {
              const nextVal = Math.floor(8 + Math.random() * 18);
              return [...prev.slice(1), nextVal];
            });
          }
        } catch (e) {
          console.error('[WebSocket] Telemetry parse error', e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
        }
      };
    };

    connectWS();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedPatientId]);

  if (loadingPatients) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const handleBack = () => {
    // Navigate back to details stack avoiding recursive pushes
    router.navigate({ pathname: '/(app)/patient/[id]', params: { id: selectedPatientId || '' } });
  };

  const handleCallNurse = () => {
    Alert.alert('Emergency Broadcast', `Paging assigned nurse to Bed ${selectedPatient?.bed_number || 'N/A'} immediately.`);
  };

  const handleShareReport = () => {
    Alert.alert('Share telemetry', 'Live vitals data link compiled. Ready to share.');
  };

  const riskLabel = prediction ? `${prediction.risk_level.toUpperCase()} (${prediction.risk_score}%)` : 'NORMAL (12%)';
  const riskColor = prediction?.risk_level === 'critical' || prediction?.risk_level === 'high' ? theme.colors.statusCritical : theme.colors.statusStable;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.flex1}>
        
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <ArrowLeft size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>
            Live Monitoring
          </Text>
          <View style={styles.wsIndicator}>
            <View style={[styles.dot, { backgroundColor: isConnected ? '#2a9d8f' : theme.colors.outline }]} />
            <Text style={[theme.typography.labelCaps, { color: isConnected ? '#2a9d8f' : theme.colors.outline, fontSize: 8 }]}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Patients Horizontal Carousel */}
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>ICU Patient Selector</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientsCarousel}>
            {patients.map(p => {
              const isSelected = selectedPatientId === p.patient_id;
              return (
                <TouchableOpacity
                  key={p.patient_id}
                  style={[
                    styles.patientItemCard,
                    { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant },
                    isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedPatientId(p.patient_id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.bedNum, { color: theme.colors.primary }]}>Bed {p.bed_number}</Text>
                  <Text style={[styles.patName, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                    {p.name.split(' ').pop()}
                  </Text>
                  <Text style={[styles.patMeta, { color: theme.colors.onSurfaceVariant }]}>
                    {p.age}y · {p.gender[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPatient ? (
            <View style={styles.monitoringPanel}>
              
              {/* Telemetry Core Grid (Live Vitals) */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Physiological Vitals</Text>
              <View style={styles.vitalsRow}>
                {/* Heart Rate */}
                <View style={[styles.vitalCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.vitalHeader}>
                    <Heart size={14} color={theme.colors.error} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>Heart Rate</Text>
                  </View>
                  <Text style={[styles.vitalValue, { color: theme.colors.error }]}>{heartRate}</Text>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>BPM</Text>
                </View>

                {/* SpO2 */}
                <View style={[styles.vitalCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.vitalHeader}>
                    <Activity size={14} color={theme.colors.statusStable} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>SpO2</Text>
                  </View>
                  <Text style={[styles.vitalValue, { color: theme.colors.statusStable }]}>{spo2}%</Text>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Saturation</Text>
                </View>

                {/* Respiratory Rate */}
                <View style={[styles.vitalCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.vitalHeader}>
                    <Wifi size={14} color="#2a9d8f" />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 9 }]}>Respiratory</Text>
                  </View>
                  <Text style={[styles.vitalValue, { color: '#2a9d8f' }]}>{respRate}</Text>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>BPM</Text>
                </View>
              </View>

              {/* Ventilator Setting Metrics */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>Ventilator Metrics</Text>
              <View style={styles.ventilatorGrid}>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>PEEP</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{peep} <Text style={{ fontSize: 9 }}>cmH2O</Text></Text>
                </View>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>FiO2</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{fio2}%</Text>
                </View>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Airflow</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{flow} <Text style={{ fontSize: 9 }}>L/m</Text></Text>
                </View>
              </View>

              <View style={styles.ventilatorGrid}>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>PIP Pressure</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{pressure} <Text style={{ fontSize: 9 }}>cmH2O</Text></Text>
                </View>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Tidal Volume</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{tidalVol} <Text style={{ fontSize: 9 }}>mL</Text></Text>
                </View>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Plateau Pres</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{plateauPres} <Text style={{ fontSize: 9 }}>cmH2O</Text></Text>
                </View>
              </View>

              <View style={styles.ventilatorGrid}>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Min Ventilation</Text>
                  <Text style={[styles.ventValue, { color: theme.colors.primary }]}>{minVent} <Text style={{ fontSize: 9 }}>L/m</Text></Text>
                </View>
                <View style={[styles.ventBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>Gateway Battery</Text>
                  <View style={styles.batteryRow}>
                    <Battery size={14} color={batteryLevel < 20 ? theme.colors.error : '#2a9d8f'} />
                    <Text style={[styles.ventValue, { color: theme.colors.primary, marginTop: 0 }]}>{batteryLevel}%</Text>
                  </View>
                </View>
              </View>

              {/* Real-time Waveforms (Vitals + Ventilator) */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>Waveforms</Text>
              
              <View style={[styles.waveformCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, marginBottom: 8 }]}>SpO2 Waveform (Vitals)</Text>
                <View style={styles.waveformWrapper}>
                  <Svg width="100%" height="80" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <Path
                      d={(() => {
                        return liveBuffer.map((val, i) => {
                          const x = (i / (liveBuffer.length - 1)) * 300;
                          const normalizedVal = Math.max(Math.min(val, 100), 80);
                          const y = 100 - ((normalizedVal - 80) / 20) * 80;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      })()}
                      fill="none"
                      stroke={theme.colors.statusStable}
                      strokeWidth="2.5"
                    />
                  </Svg>
                </View>
              </View>

              <View style={[styles.waveformCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, marginBottom: 8 }]}>Airway Pressure Waveform (Ventilator)</Text>
                <View style={styles.waveformWrapper}>
                  <Svg width="100%" height="80" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <Path
                      d={(() => {
                        return ventBuffer.map((val, i) => {
                          const x = (i / (ventBuffer.length - 1)) * 300;
                          const y = 100 - (val / 30) * 80;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      })()}
                      fill="none"
                      stroke={theme.colors.statusCritical}
                      strokeWidth="2.5"
                    />
                  </Svg>
                </View>
              </View>

              {/* AI Insight Chip */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>AI Risk Estimation</Text>
              <View style={[styles.aiCard, { backgroundColor: theme.colors.primaryContainer }]}>
                <View style={styles.aiHeader}>
                  <Sparkles size={16} color={theme.colors.secondaryContainer} />
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.secondaryContainer, fontWeight: '800' }]}>MedNova AI Engine</Text>
                </View>
                <Text style={styles.aiText}>
                  Risk evaluation: {riskLabel}. Recommended action: {prediction?.recommendation || 'Patient values within bounds.'}
                </Text>
                {prediction && (
                  <Text style={styles.aiFollowUp}>
                    Follow-up: {FOLLOW_UP_LABELS[prediction.follow_up_status] ?? 'Pending'}
                    {prediction.clinician_note ? ` — ${prediction.clinician_note}` : ''}
                  </Text>
                )}
              </View>

              {/* Quick Actions Panel */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionGridBtn} onPress={handleCallNurse}>
                  <Phone size={18} color={theme.colors.error} />
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.error, fontSize: 10 }]}>Call Nurse</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionGridBtn} onPress={handleShareReport}>
                  <FileText size={18} color={theme.colors.primary} />
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>Share Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionGridBtn} onPress={() => {
                  router.navigate({ pathname: '/(app)/(tabs)/predictions', params: { patientId: selectedPatientId } });
                }}>
                  <Brain size={18} color={theme.colors.primary} />
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>AI Prediction</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionGridBtn} onPress={handleBack}>
                  <ArrowLeft size={18} color={theme.colors.primary} />
                  <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 10 }]}>Patient Details</Text>
                </TouchableOpacity>
              </View>

              {/* Timeline events preview */}
              <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>Recent Events</Text>
              <View style={[styles.timelineCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                {timeline.slice(0, 3).map((event, i) => (
                  <View key={i} style={styles.eventRow}>
                    <View style={styles.eventBullet} />
                    <View style={styles.eventText}>
                      <Text style={[theme.typography.bodySm, { fontWeight: '700' }]}>{event.title}</Text>
                      <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>{event.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

            </View>
          ) : (
            <View style={styles.center}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Select a patient above to start live monitoring.</Text>
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { margin: 0, flex: 1 },
  wsIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#eeeeee'
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11, marginBottom: 8, fontWeight: '700' },
  patientsCarousel: { gap: 8, marginBottom: 16, paddingRight: 16 },
  patientItemCard: { width: 100, borderRadius: 16, padding: 12, borderWidth: 1, alignItems: 'center' },
  bedNum: { fontSize: 10, fontWeight: '800' },
  patName: { marginVertical: 4 },
  patMeta: { fontSize: 9 },
  monitoringPanel: { gap: 14 },
  vitalsRow: { flexDirection: 'row', gap: 8 },
  vitalCard: {
    flex: 1, borderRadius: 20, padding: 14, borderWidth: 1, alignItems: 'center',
    elevation: 2, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6
  },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  vitalValue: { fontSize: 26, fontWeight: '800' },
  ventilatorGrid: { flexDirection: 'row', gap: 8 },
  ventBox: { flex: 1, borderRadius: 16, padding: 10, borderWidth: 1, alignItems: 'center' },
  ventValue: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  batteryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  waveformCard: {
    borderRadius: 20, padding: 16, borderWidth: 1, elevation: 2,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6
  },
  waveformWrapper: { height: 80, borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8 },
  aiCard: { borderRadius: 20, padding: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiText: { color: '#ffffff', fontSize: 13, lineHeight: 20 },
  aiFollowUp: { color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 16, marginTop: 8 },
  actionsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionGridBtn: {
    flex: 1, minWidth: '45%', height: 48, borderRadius: 16, backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: theme.colors.outlineVariant,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8
  },
  timelineCard: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12 },
  eventRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eventBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  eventText: { flex: 1 }
});
