import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, TextInput, Alert as RNAlert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDoctorAlertsQuery, useDoctorAcknowledgeAlertMutation,
  useDoctorResolveAlertMutation, useAddAlertNoteMutation
} from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { ShieldAlert, CheckCircle2, ChevronRight, Activity, FileText, Send } from 'lucide-react-native';
import { formatDateTime } from '@mednova/utils';
import { router } from 'expo-router';
import { theme } from '../../../constants/theme';
import { Alert } from '@mednova/types';

const ALERT_COLORS: Record<string, string> = {
  critical: theme.colors.statusCritical,
  high:     theme.colors.statusCritical,
  medium:   theme.colors.secondaryContainer,
  low:      theme.colors.statusStable,
  device:   theme.colors.primary,
};

const SEVERITY_FILTERS = [
  { key: 'all', label: 'All Severities' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' }
];

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' }
];

export default function AlertsScreen() {
  const { canAcknowledgeAlerts, canResolveAlerts } = useRBAC();

  const [statusTab, setStatusTab] = useState('pending');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // Query alerts via clinician specific repository
  const queryParams = {
    status: statusTab as any,
    alert_type: severityFilter === 'all' ? undefined : (severityFilter as any)
  };

  const { data: alerts = [], isLoading, refetch } = useDoctorAlertsQuery(queryParams);
  const ackMutation = useDoctorAcknowledgeAlertMutation();
  const resolveMutation = useDoctorResolveAlertMutation();
  const addNoteMutation = useAddAlertNoteMutation();

  const handleAcknowledge = async (id: string) => {
    try {
      await ackMutation.mutateAsync(id);
      RNAlert.alert('Alert Acknowledged', 'The alert status has been updated.');
    } catch (e: any) {
      RNAlert.alert('Error', e.message || 'Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      RNAlert.alert('Alert Resolved', 'The alert has been marked as resolved.');
    } catch (e: any) {
      RNAlert.alert('Error', e.message || 'Failed to resolve alert.');
    }
  };

  const handleAddNote = async (alertId: string) => {
    const text = noteInputs[alertId];
    if (!text || !text.trim()) return;
    try {
      await addNoteMutation.mutateAsync({ alertId, noteText: text });
      setNoteInputs(prev => ({ ...prev, [alertId]: '' }));
      RNAlert.alert('Note Added', 'Your note has been added to the alert timeline.');
      refetch();
    } catch (e: any) {
      RNAlert.alert('Error', e.message || 'Failed to add note.');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CheckCircle2 size={44} color={theme.colors.statusStable} />
      <Text style={[styles.emptyTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '800' }]}>All Clear</Text>
      <Text style={[styles.emptyText, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
        No alerts match the selected status or severity filter.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>Alerts Console</Text>
        <Text style={[styles.headerSub, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
          {alerts.length} listed
        </Text>
      </View>

      {/* Status Filter Tabs (Pending, Acknowledged, Resolved) */}
      <View style={styles.statusTabRow}>
        {STATUS_FILTERS.map(tab => {
          const isActive = statusTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.statusTabBtn, isActive && styles.statusTabActive]}
              onPress={() => setStatusTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusTabText, theme.typography.labelCaps, { color: isActive ? theme.colors.primary : theme.colors.outline }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Severity Filter Carousel */}
      <View style={styles.severityTabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.severityTabScroll}>
          {SEVERITY_FILTERS.map(tab => {
            const isActive = severityFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.severityTab, isActive && styles.severityTabActive]}
                onPress={() => setSeverityFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.severityLabel, theme.typography.labelCaps, { color: isActive ? '#ffffff' : theme.colors.primary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Alert List */}
      {isLoading ? (
        <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.alert_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
          renderItem={({ item }) => {
            const accentColor = ALERT_COLORS[item.alert_type] ?? theme.colors.primary;
            return (
              <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant, borderLeftColor: accentColor }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <ShieldAlert size={16} color={accentColor} />
                    <Text style={[styles.alertType, theme.typography.labelCaps, { color: accentColor, fontWeight: '800' }]}>
                      {item.alert_type.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={[styles.time, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>{formatDateTime(item.created_at)}</Text>
                  </View>
                </View>

                {/* Message */}
                <Text style={[styles.message, theme.typography.bodySm, { color: theme.colors.onSurface }]}>{item.message}</Text>

                {/* Status and Action Buttons */}
                <View style={styles.statusRow}>
                  <View style={[styles.statusPill, { backgroundColor: 'rgba(20,33,61,0.06)' }]}>
                    <Text style={[styles.statusText, theme.typography.labelCaps, { color: theme.colors.statusStable }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Note Form */}
                <View style={styles.noteBox}>
                  <TextInput
                    style={styles.noteInput}
                    value={noteInputs[item.alert_id] || ''}
                    onChangeText={(val) => setNoteInputs(prev => ({ ...prev, [item.alert_id]: val }))}
                    placeholder="Add clinical note..."
                    placeholderTextColor={theme.colors.outline}
                  />
                  <TouchableOpacity style={styles.noteSendBtn} onPress={() => handleAddNote(item.alert_id)} activeOpacity={0.8}>
                    <Send size={12} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Navigation and State Action Controls */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                    onPress={() => router.push({ pathname: '/(app)/patient/[id]', params: { id: item.patient_id } })}
                    activeOpacity={0.7}
                  >
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 8 }]}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                    onPress={() => router.navigate({ pathname: '/(app)/monitoring', params: { patientId: item.patient_id } })}
                    activeOpacity={0.7}
                  >
                    <Activity size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 8 }]}>Monitor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                    onPress={() => router.navigate({ pathname: '/(app)/(tabs)/reports', params: { patientId: item.patient_id } })}
                    activeOpacity={0.7}
                  >
                    <FileText size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[theme.typography.labelCaps, { color: theme.colors.primary, fontSize: 8 }]}>Reports</Text>
                  </TouchableOpacity>
                </View>

                {/* Alert State Mutations */}
                <View style={[styles.actions, { marginTop: 8 }]}>
                  {item.status === 'pending' && canAcknowledgeAlerts && (
                    <TouchableOpacity
                      style={[styles.actionMutationBtn, { backgroundColor: theme.colors.secondaryContainer }]}
                      onPress={() => handleAcknowledge(item.alert_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700', fontSize: 10 }]}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'resolved' && canResolveAlerts && (
                    <TouchableOpacity
                      style={[styles.actionMutationBtn, { backgroundColor: theme.colors.primary }]}
                      onPress={() => handleResolve(item.alert_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[theme.typography.bodySm, { color: '#ffffff', fontWeight: '700', fontSize: 10 }]}>Resolve</Text>
                    </TouchableOpacity>
                  )}
                </View>

              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { flex: 1 },
  headerSub: { fontSize: 11 },
  statusTabRow: { flexDirection: 'row', marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant + '33', marginBottom: 12 },
  statusTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statusTabActive: { borderBottomColor: theme.colors.primary },
  statusTabText: { fontSize: 10 },
  severityTabRow: { height: 36, marginBottom: 12 },
  severityTabScroll: { paddingHorizontal: 20, gap: 8 },
  severityTab: {
    paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.colors.outlineVariant
  },
  severityTabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  severityLabel: { fontSize: 9 },
  list: { padding: 20, paddingTop: 4, paddingBottom: 100 },
  card: {
    borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1,
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertType: { fontSize: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 10 },
  message: { lineHeight: 18, marginBottom: 10 },
  statusRow: { marginBottom: 10 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 8 },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', height: 36, backgroundColor: '#ffffff',
    borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outlineVariant, paddingHorizontal: 10, marginBottom: 12
  },
  noteInput: { flex: 1, height: '100%', fontSize: 12, color: theme.colors.primary },
  noteSendBtn: { padding: 4 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flex: 1, height: 32, borderRadius: 8, backgroundColor: '#ffffff',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
  },
  actionMutationBtn: {
    flex: 1, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { },
  emptyText: { paddingHorizontal: 32, lineHeight: 18 }
});
