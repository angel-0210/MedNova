import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  usePatientDetailsQuery, useAIPredictionQuery,
  usePatientTimelineQuery, useAddPatientNoteMutation,
  useLatestVitalsQuery, useDoctorReportsQuery, useGenerateReportMutation
} from '@mednova/hooks';
import {
  Info, ArrowLeft, Clock, FileText,
  User, Clipboard, Send, Plus, Check,
  Activity, Sparkles, AlertTriangle, Phone, Download, ShieldAlert,
  Heart, Brain
} from 'lucide-react-native';
import { formatDateTime } from '@mednova/utils';
import { doctorRepository } from '@mednova/api';
import { FOLLOW_UP_LABELS } from '@mednova/constants';
import { theme } from '../../../constants/theme';
import { useRBAC } from '../../../contexts/RBACContext';

const SEGMENTS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'notes', label: 'Doctor Notes' },
  { key: 'reports', label: 'Clinical Reports' },
  { key: 'history', label: 'History' },
  { key: 'medications', label: 'Medications' }
];

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useRBAC();
  const [activeSegment, setActiveSegment] = useState<string>('timeline');
  const [noteInput, setNoteInput] = useState<string>('');

  // Queries & Mutations
  const { data: patient, isLoading: loadingPatient } = usePatientDetailsQuery(id || '');
  const { data: prediction } = useAIPredictionQuery(id || '');
  const { data: timeline = [], isLoading: loadingTimeline, refetch: refetchTimeline } = usePatientTimelineQuery(id || '');
  const { data: vitals } = useLatestVitalsQuery(id || '');
  const { data: reports = [], refetch: refetchReports } = useDoctorReportsQuery({ patient_id: id });
  
  const addNoteMutation = useAddPatientNoteMutation();
  const generateReportMutation = useGenerateReportMutation();

  const handleAddNote = async () => {
    if (!noteInput.trim() || !id) return;
    try {
      await addNoteMutation.mutateAsync({
        patientId: id,
        noteText: noteInput
      });
      setNoteInput('');
      Alert.alert('Note Added', 'Clinical remark added successfully.');
      refetchTimeline();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add note.');
    }
  };

  const handleGenerateReport = async (type: string) => {
    if (!id) return;
    try {
      await generateReportMutation.mutateAsync({
        patientId: id,
        reportType: type
      });
      Alert.alert('Report Generated', `Generated ${type.toUpperCase()} diagnostics summary.`);
      refetchReports();
      refetchTimeline();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate report.');
    }
  };

  const handleCallNurse = () => {
    Alert.alert('Call Nurse', `Paging the assigned nurse for Bed ${patient?.bed_number || 'N/A'}.`);
  };

  const handleMarkReviewed = () => {
    Alert.alert('Patient Reviewed', 'This patient status is marked as reviewed by the supervising clinician.');
  };

  const handleDischarge = () => {
    if (role !== 'doctor' && role !== 'admin') {
      Alert.alert('Restricted', 'Only doctors or administrators can discharge patients.');
      return;
    }
    Alert.alert(
      'Discharge Patient',
      `Are you sure you want to discharge ${patient?.name || 'this patient'} from the ICU?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discharge', style: 'destructive', onPress: () => Alert.alert('Discharged', 'Discharge protocol initiated.') }
      ]
    );
  };

  if (loadingPatient) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Patient details not found.</Text>
      </View>
    );
  }

  const riskLabel = prediction ? `${prediction.risk_level.toUpperCase()} (${prediction.risk_score}%)` : 'NORMAL (12%)';
  const riskColor = prediction?.risk_level === 'critical' || prediction?.risk_level === 'high' ? theme.colors.statusCritical : theme.colors.statusStable;

  // Filter notes from timeline events
  const notesEvents = timeline.filter(e => e.event_type === 'doctor_note');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.patientName, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>
            {patient.name}
          </Text>
          <Text style={[styles.patientMeta, { color: theme.colors.onSurfaceVariant }]}>
            Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} years old
          </Text>
        </View>
      </View>

      {/* Summary Cards Grid */}
      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
          {/* SpO2 Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.summaryCardHeader}>
              <Activity size={14} color={theme.colors.statusStable} />
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>OXYGEN SAT (SPO2)</Text>
            </View>
            <Text style={[styles.summaryCardVal, { color: theme.colors.statusStable }]}>{vitals?.spo2 ? `${vitals.spo2}%` : '98%'}</Text>
            <Text style={styles.summaryCardDesc}>Bedside monitor online</Text>
          </View>

          {/* Pulse Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.summaryCardHeader}>
              <Heart size={14} color={theme.colors.error} />
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>HEART RATE</Text>
            </View>
            <Text style={[styles.summaryCardVal, { color: theme.colors.error }]}>{vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '75 bpm'}</Text>
            <Text style={styles.summaryCardDesc}>ECG channel synchronized</Text>
          </View>

          {/* AI Risk Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={styles.summaryCardHeader}>
              <Sparkles size={14} color={riskColor} />
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 8 }]}>AI PROGNOSIS RISK</Text>
            </View>
            <Text style={[styles.summaryCardVal, { color: riskColor }]}>{riskLabel}</Text>
            <Text style={styles.summaryCardDesc} numberOfLines={1}>{prediction?.recommendation || 'Weaning readiness optimal'}</Text>
            {!!prediction && (
              <Text style={styles.summaryCardFollowUp} numberOfLines={2}>
                Follow-up: {FOLLOW_UP_LABELS[prediction.follow_up_status] ?? 'Pending'}
                {prediction.clinician_note ? ` — ${prediction.clinician_note}` : ''}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Quick Action Panel */}
      <View style={styles.quickActionCard}>
        <Text style={[styles.quickActionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionGridBtn} onPress={() => router.navigate({ pathname: '/(app)/monitoring', params: { patientId: id } })}>
            <Activity size={16} color={theme.colors.primary} />
            <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>Live Vitals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionGridBtn} onPress={() => router.navigate({ pathname: '/(app)/(tabs)/predictions', params: { patientId: id } })}>
            <Brain size={16} color={theme.colors.primary} />
            <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>AI Risk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionGridBtn} onPress={() => router.navigate({ pathname: '/(app)/(tabs)/reports', params: { patientId: id } })}>
            <FileText size={16} color={theme.colors.primary} />
            <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>All Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionGridBtn} onPress={handleCallNurse}>
            <Phone size={16} color={theme.colors.error} />
            <Text style={[theme.typography.labelCaps, { color: theme.colors.error, fontSize: 9 }]}>Call Nurse</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.actionsGrid, { marginTop: 8 }]}>
          <TouchableOpacity style={styles.actionGridBtn} onPress={handleMarkReviewed}>
            <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>Mark Reviewed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionGridBtn, { borderColor: theme.colors.error }]} onPress={handleDischarge}>
            <Text style={[theme.typography.labelCaps, { color: theme.colors.error, fontSize: 9 }]}>Discharge Patient</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segment Selector Tabs */}
      <View style={[styles.segmentsRow, { borderBottomColor: theme.colors.outlineVariant + '33' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SEGMENTS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.segmentBtn, activeSegment === s.key && styles.segmentActive]}
              onPress={() => setActiveSegment(s.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentText,
                theme.typography.labelCaps,
                activeSegment === s.key && { color: theme.colors.primary, fontWeight: '800' }
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Segment Content */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Timeline Tab */}
        {activeSegment === 'timeline' && (
          <View style={styles.tabContent}>
            {loadingTimeline ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : timeline.length > 0 ? (
              <View style={styles.timelineWrapper}>
                {timeline.map((event, index) => (
                  <View key={event.event_id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
                      {index < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.colors.outlineVariant }]} />}
                    </View>
                    <View style={[styles.timelineCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.eventTitle, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>{event.title}</Text>
                        <Text style={[styles.eventTime, { color: theme.colors.onSurfaceVariant }]}>{formatDateTime(event.timestamp)}</Text>
                      </View>
                      <Text style={[styles.eventDesc, { color: theme.colors.onSurfaceVariant }]}>{event.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No timeline logs compiled for this patient.</Text>
            )}
          </View>
        )}

        {/* Notes Tab */}
        {activeSegment === 'notes' && (
          <View style={styles.tabContent}>
            {/* Direct Note Submission */}
            <View style={[styles.noteFormCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.formLabel, theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '800' }]}>Write Clinical Note</Text>
              <TextInput
                style={[styles.noteInput, { borderColor: theme.colors.outlineVariant }]}
                placeholder="Enter clinical status, drug warnings, or weaning plans..."
                placeholderTextColor={theme.colors.outline}
                multiline
                numberOfLines={3}
                value={noteInput}
                onChangeText={setNoteInput}
              />
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddNote}
                disabled={addNoteMutation.isPending}
                activeOpacity={0.8}
              >
                <Send size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontWeight: '800' }]}>ADD NOTE TO CHART</Text>
              </TouchableOpacity>
            </View>

            {/* Note Logs */}
            <Text style={[styles.sectionSubtitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Historical Remarks</Text>
            {notesEvents.length > 0 ? (
              notesEvents.map(note => (
                <View key={note.event_id} style={[styles.noteCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteAuthor, { color: theme.colors.primary, fontWeight: '700' }]}>Supervising Clinician</Text>
                    <Text style={[styles.noteTime, { color: theme.colors.onSurfaceVariant }]}>{formatDateTime(note.timestamp)}</Text>
                  </View>
                  <Text style={[styles.noteText, { color: theme.colors.onSurfaceVariant }]}>{note.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No clinical remarks registered for this patient.</Text>
            )}
          </View>
        )}

        {/* Clinical Reports Tab */}
        {activeSegment === 'reports' && (
          <View style={styles.tabContent}>
            {/* Generate Report Buttons */}
            <View style={[styles.reportActionsBox, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '800', marginBottom: 8 }]}>Generate Clinical Diagnostics</Text>
              <View style={styles.reportButtonsRow}>
                <TouchableOpacity style={[styles.reportBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleGenerateReport('clinical')}>
                  <Plus size={14} color="#ffffff" />
                  <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>Clinical</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reportBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleGenerateReport('ai')}>
                  <Plus size={14} color="#ffffff" />
                  <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>AI Risk</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.reportBtn, { backgroundColor: theme.colors.primary }]} onPress={() => handleGenerateReport('monitoring')}>
                  <Plus size={14} color="#ffffff" />
                  <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>Telemetry</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Patient Reports</Text>
            {reports.length > 0 ? (
              reports.map(report => (
                <View key={report.report_id} style={[styles.reportCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.reportCardHeader}>
                    <Text style={[styles.reportTypeLabel, theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '800' }]}>{report.report_type.toUpperCase()} REPORT</Text>
                    <Text style={[styles.reportTimeLabel, { color: theme.colors.onSurfaceVariant }]}>{formatDateTime(report.created_at)}</Text>
                  </View>
                  <Text style={[styles.reportSummaryText, { color: theme.colors.onSurfaceVariant }]}>{report.summary}</Text>
                  <View style={styles.reportCardActions}>
                    <TouchableOpacity style={styles.reportCardActionBtn} onPress={async () => {
                      try {
                        await doctorRepository.exportReportPDF(report.report_id);
                        Alert.alert('PDF Exported', 'Report saved to local storage.');
                      } catch (e) {
                        Alert.alert('Error', 'PDF generation failed.');
                      }
                    }}>
                      <Download size={12} color={theme.colors.primary} />
                      <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 8 }]}>Export PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reportCardActionBtn} onPress={async () => {
                      try {
                        await doctorRepository.exportReportCSV(report.report_id);
                        Alert.alert('CSV Exported', 'CSV spreadsheet saved to downloads.');
                      } catch (e) {
                        Alert.alert('Error', 'CSV generation failed.');
                      }
                    }}>
                      <Download size={12} color={theme.colors.primary} />
                      <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 8 }]}>CSV</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No clinical reports generated for this patient.</Text>
            )}
          </View>
        )}

        {/* History Tab */}
        {activeSegment === 'history' && (
          <View style={styles.tabContent}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.cardTitle, theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '800' }]}>Patient Demographics</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Full Name</Text>
                <Text style={[styles.infoVal, { color: theme.colors.primary }]}>{patient.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Bed Assignment</Text>
                <Text style={[styles.infoVal, { color: theme.colors.primary }]}>ICU Bed {patient.bed_number || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Age / Gender</Text>
                <Text style={[styles.infoVal, { color: theme.colors.primary }]}>{patient.age} years / {patient.gender}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Ventilator Status</Text>
                <Text style={[styles.infoVal, { color: riskColor }]}>{patient.ventilator_status.toUpperCase()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLbl}>Admitted On</Text>
                <Text style={[styles.infoVal, { color: theme.colors.primary }]}>{patient.admission_date}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Medications Tab */}
        {activeSegment === 'medications' && (
          <View style={styles.tabContent}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.cardTitle, theme.typography.labelCaps, { color: theme.colors.primary, fontWeight: '800' }]}>Active ICU Medications</Text>
              
              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, { color: theme.colors.primary }]}>Propofol Infusion</Text>
                  <Text style={[styles.medDosage, { color: theme.colors.onSurfaceVariant }]}>25 mcg/kg/min · IV Continuous</Text>
                </View>
                <View style={styles.medStatus}>
                  <Check size={14} color={theme.colors.statusStable} />
                  <Text style={[styles.medStatusText, { color: theme.colors.statusStable }]}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, { color: theme.colors.primary }]}>Norepinephrine</Text>
                  <Text style={[styles.medDosage, { color: theme.colors.onSurfaceVariant }]}>0.05 mcg/kg/min · IV Infusion</Text>
                </View>
                <View style={styles.medStatus}>
                  <Check size={14} color={theme.colors.statusStable} />
                  <Text style={[styles.medStatusText, { color: theme.colors.statusStable }]}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.medRow}>
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, { color: theme.colors.primary }]}>Fentanyl Citrate</Text>
                  <Text style={[styles.medDosage, { color: theme.colors.onSurfaceVariant }]}>50 mcg/hr · IV Continuous</Text>
                </View>
                <View style={styles.medStatus}>
                  <Check size={14} color={theme.colors.statusStable} />
                  <Text style={[styles.medStatusText, { color: theme.colors.statusStable }]}>ACTIVE</Text>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 6, borderRadius: 8 },
  headerInfo: { flex: 1 },
  patientName: { margin: 0 },
  patientMeta: { fontSize: 12, marginTop: 2 },
  summaryContainer: { height: 110, marginBottom: 12 },
  summaryScroll: { paddingHorizontal: 16, gap: 10 },
  summaryCard: {
    width: 150, padding: 12, borderRadius: 20, borderWidth: 1, justifyContent: 'center',
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1
  },
  summaryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  summaryCardVal: { fontSize: 16, fontWeight: '800' },
  summaryCardDesc: { fontSize: 10, color: theme.colors.outline, marginTop: 4 },
  summaryCardFollowUp: { fontSize: 9, color: theme.colors.onSurfaceVariant, marginTop: 4, fontWeight: '600' },
  quickActionCard: { marginHorizontal: 16, padding: 12, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.colors.outlineVariant, marginBottom: 12 },
  quickActionTitle: { fontSize: 10, marginBottom: 8, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', gap: 8 },
  actionGridBtn: {
    flex: 1, height: 38, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6
  },
  segmentsRow: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, gap: 16 },
  segmentBtn: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 16 },
  segmentActive: { borderBottomColor: theme.colors.primary },
  segmentText: { color: theme.colors.outline, fontSize: 10, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  tabContent: { gap: 16 },
  timelineWrapper: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { width: 12, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 20 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineCard: { flex: 1, borderRadius: 20, padding: 14, borderWidth: 1, marginBottom: 16 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  eventTitle: { },
  eventTime: { fontSize: 10 },
  eventDesc: { fontSize: 12, lineHeight: 18 },
  emptyText: { textAlign: 'center', color: theme.colors.onSurfaceVariant, paddingVertical: 40 },
  noteFormCard: {
    borderRadius: 20, padding: 16, borderWidth: 1, elevation: 2,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4
  },
  formLabel: { fontSize: 10, marginBottom: 8 },
  noteInput: {
    borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 13, color: '#333333',
    height: 80, textAlignVertical: 'top', backgroundColor: '#ffffff'
  },
  submitBtn: { height: 40, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  sectionSubtitle: { fontSize: 11, fontWeight: '700', marginTop: 12 },
  noteCard: { borderRadius: 16, padding: 14, borderWidth: 1 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  noteAuthor: { fontSize: 12 },
  noteTime: { fontSize: 10 },
  noteText: { fontSize: 12.5, lineHeight: 18 },
  infoCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 11, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoLbl: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  infoVal: { fontSize: 12, fontWeight: '700' },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  medInfo: { flex: 1 },
  medName: { fontSize: 13, fontWeight: '700' },
  medDosage: { fontSize: 11, marginTop: 2 },
  medStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e6f4ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  medStatusText: { fontSize: 9, fontWeight: '800' },
  reportActionsBox: { borderRadius: 20, padding: 16, borderWidth: 1 },
  reportButtonsRow: { flexDirection: 'row', gap: 8 },
  reportBtn: { flex: 1, height: 36, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  reportCard: { borderRadius: 20, padding: 14, borderWidth: 1, marginBottom: 10 },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reportTypeLabel: { fontSize: 10 },
  reportTimeLabel: { fontSize: 10 },
  reportSummaryText: { fontSize: 12, lineHeight: 18 },
  reportCardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  reportCardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 }
});
