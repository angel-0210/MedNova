import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal,
  Alert, Button
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  useDoctorReportsQuery, useDoctorPatientsQuery,
  useGenerateReportMutation
} from '@mednova/hooks';
import { FileText, Plus, Download, Eye, Sparkles, ChevronRight, X } from 'lucide-react-native';
import { formatDateTime } from '@mednova/utils';
import { doctorRepository } from '@mednova/api';
import { theme } from '../../../constants/theme';

const REPORT_TYPES = [
  { key: 'clinical', label: 'Clinical' },
  { key: 'ai', label: 'AI Risk' },
  { key: 'monitoring', label: 'Telemetry' },
  { key: 'alert', label: 'Alert Logs' },
  { key: 'timeline', label: 'Timeline' }
];

export default function ReportsScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const [activeTab, setActiveTab] = useState<string>('clinical');
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedGenType, setSelectedGenType] = useState<string>('clinical');
  const [previewText, setPreviewText] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const queryParams = {
    report_type: activeTab,
    patient_id: patientId || undefined
  };

  const { data: reports = [], isLoading: loadingReports } = useDoctorReportsQuery(queryParams);
  const { data: patients = [], isLoading: loadingPatients } = useDoctorPatientsQuery();
  const generateMutation = useGenerateReportMutation();

  const handleGenerateReport = async () => {
    if (!selectedPatientId) {
      Alert.alert('Selection Required', 'Please select a patient first.');
      return;
    }
    try {
      await generateMutation.mutateAsync({
        patientId: selectedPatientId,
        reportType: selectedGenType
      });
      setGenerateModalVisible(false);
      Alert.alert('Report Generated', 'Patient diagnostics report created successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate report.');
    }
  };

  const handlePreviewReport = async (reportId: string, typeLabel: string) => {
    try {
      const res = await doctorRepository.getReportPreview(reportId);
      setPreviewTitle(`${typeLabel.toUpperCase()} REPORT PREVIEW`);
      setPreviewText(res.preview);
      setPreviewModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to load report preview.');
    }
  };

  const handleExportPDF = async (reportId: string) => {
    try {
      await doctorRepository.exportReportPDF(reportId);
      Alert.alert('Export PDF', 'Diagnostic PDF compiled and downloaded to storage.');
    } catch (e) {
      Alert.alert('Error', 'Failed to export report to PDF.');
    }
  };

  const handleExportCSV = async (reportId: string) => {
    try {
      await doctorRepository.exportReportCSV(reportId);
      Alert.alert('Export CSV', 'Clinical spreadsheet compiled and saved to downloads.');
    } catch (e) {
      Alert.alert('Error', 'Failed to export report to CSV.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.flex1}>
        
        {/* Header */}
        <View style={styles.header}>
          <FileText size={24} color={theme.colors.primary} />
          <Text style={[styles.title, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800', flex: 1 }]}>
            Reports Console
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (patients.length > 0) {
                setSelectedPatientId(patients[0].patient_id);
              }
              setGenerateModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>GENERATE</Text>
          </TouchableOpacity>
        </View>

        {patientId && (
          <View style={styles.filterBanner}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>
              Filtered by Patient: {patients.find(p => p.patient_id === patientId)?.name || 'ICU Patient'}
            </Text>
            <TouchableOpacity style={styles.clearBtn} onPress={() => router.replace('/(app)/(tabs)/reports')}>
              <Text style={[theme.typography.labelCaps, { color: theme.colors.error, fontSize: 10 }]}>CLEAR FILTER</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Selection */}
        <View style={[styles.tabsRow, { borderBottomColor: theme.colors.outlineVariant + '33' }]}>
          {REPORT_TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                theme.typography.labelCaps,
                activeTab === t.key && { color: theme.colors.primary, fontWeight: '800' }
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reports List */}
        {loadingReports ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {reports.length > 0 ? (
              reports.map((report) => {
                const patName = patients.find(p => p.patient_id === report.patient_id)?.name || 'ICU Patient';
                const typeLabel = REPORT_TYPES.find(t => t.key === report.report_type)?.label || 'Clinical';
                return (
                  <View 
                    key={report.report_id} 
                    style={[styles.reportCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
                  >
                    <View style={styles.reportHeader}>
                      <View>
                        <Text style={[styles.reportPatient, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>{patName}</Text>
                        <Text style={[styles.reportMeta, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]}>
                          Type: {typeLabel} · {formatDateTime(report.created_at)}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, theme.typography.labelCaps, { color: theme.colors.statusStable }]}>
                          {report.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.reportSummary, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
                      {report.summary}
                    </Text>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant }]}
                        onPress={() => handlePreviewReport(report.report_id, typeLabel)}
                        activeOpacity={0.7}
                      >
                        <Eye size={12} color={theme.colors.primary} />
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>Preview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant }]}
                        onPress={() => handleExportPDF(report.report_id)}
                        activeOpacity={0.7}
                      >
                        <Download size={12} color={theme.colors.primary} />
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant }]}
                        onPress={() => handleExportCSV(report.report_id)}
                        activeOpacity={0.7}
                      >
                        <Download size={12} color={theme.colors.primary} />
                        <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 9 }]}>CSV</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.empty}>
                <FileText size={44} color={theme.colors.outline} />
                <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>
                  No generated {activeTab} reports in this hospital.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Generate Report Modal */}
        <Modal visible={generateModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>Generate Diagnostics Report</Text>
                <TouchableOpacity onPress={() => setGenerateModalVisible(false)}>
                  <X size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Select Patient */}
                <Text style={[styles.fieldLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Select Patient</Text>
                <View style={styles.pickerContainer}>
                  {patients.map(p => (
                    <TouchableOpacity
                      key={p.patient_id}
                      style={[
                        styles.pickerPill,
                        selectedPatientId === p.patient_id && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => setSelectedPatientId(p.patient_id)}
                    >
                      <Text style={[
                        styles.pickerPillText,
                        selectedPatientId === p.patient_id && { color: '#ffffff' }
                      ]}>
                        Bed {p.bed_number} · {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Select Report Type */}
                <Text style={[styles.fieldLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>Select Report Type</Text>
                <View style={styles.pickerContainer}>
                  {REPORT_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.pickerPill,
                        selectedGenType === t.key && { backgroundColor: theme.colors.secondaryContainer }
                      ]}
                      onPress={() => setSelectedGenType(t.key)}
                    >
                      <Text style={[
                        styles.pickerPillText,
                        selectedGenType === t.key && { color: '#ffffff' }
                      ]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleGenerateReport}
                disabled={generateMutation.isPending}
                activeOpacity={0.8}
              >
                {generateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[theme.typography.labelCaps, { color: '#ffffff', fontWeight: '800' }]}>GENERATE CLINICAL REPORT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Preview Modal */}
        <Modal visible={previewModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: '#ffffff', maxHeight: '75%' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>{previewTitle}</Text>
                <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                  <X size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.previewScroll}>
                <Text style={styles.previewTextContent}>{previewText}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  title: {
    margin: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.outline,
    fontSize: 10,
  },
  list: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  reportCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportPatient: {
  },
  reportMeta: {
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(20,33,61,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  reportSummary: {
    lineHeight: 18,
    fontSize: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  empty: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,10,36,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingBottom: 10,
    marginBottom: 16,
  },
  modalTitle: {
  },
  modalBody: {
    paddingBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: '700',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f1f1',
  },
  pickerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
  submitBtn: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  previewScroll: {
    paddingVertical: 10,
  },
  previewTextContent: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333333',
    fontFamily: 'System',
  },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(20,33,61,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant + '33',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
