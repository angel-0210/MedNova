import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import {
  useAlertsQuery, useAcknowledgeAlertMutation,
  useResolveAlertMutation,
} from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { formatDateTime } from '@mednova/utils';
import { router } from 'expo-router';
import { Alert } from '@mednova/types';

const ALERT_COLORS: Record<string, string> = {
  critical: '#d90429',
  high:     '#f77f00',
  medium:   '#fca311',
  low:      '#2a9d8f',
  device:   '#66fcf1',
};

const AlertCard: React.FC<{
  item: Alert;
  canAcknowledge: boolean;
  canResolve: boolean;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}> = ({ item, canAcknowledge, canResolve, onAcknowledge, onResolve }) => {
  const accentColor = ALERT_COLORS[item.alert_type] ?? '#66fcf1';

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      {/* Card header: type + timestamp + patient link */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <ShieldAlert size={16} color={accentColor} />
          <Text style={[styles.alertType, { color: accentColor }]}>
            {item.alert_type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.time}>{formatDateTime(item.created_at)}</Text>
          <TouchableOpacity
            style={styles.patientBtn}
            onPress={() =>
              router.push({ pathname: '/(app)/patient/[id]', params: { id: item.patient_id } })
            }
          >
            <ChevronRight size={14} color="#66fcf1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.message}>{item.message}</Text>

      {/* Status badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: item.status === 'pending' ? 'rgba(247,127,0,0.15)' : 'rgba(42,157,143,0.15)' }]}>
          <Text style={[styles.statusText, { color: item.status === 'pending' ? '#f77f00' : '#2a9d8f' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Actions — only for clinicians */}
      {(canAcknowledge || canResolve) && (
        <View style={styles.actions}>
          {item.status === 'pending' && canAcknowledge && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.ackBtn]}
              onPress={() => onAcknowledge(item.alert_id)}
              activeOpacity={0.8}
            >
              <Text style={styles.ackText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'resolved' && canResolve && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={() => onResolve(item.alert_id)}
              activeOpacity={0.8}
            >
              <Text style={styles.resolveText}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default function AlertsScreen() {
  const { data: alerts = [], isLoading } = useAlertsQuery();
  const { canAcknowledgeAlerts, canResolveAlerts } = useRBAC();

  const acknowledgeAlert = useAcknowledgeAlertMutation();
  const resolveAlert     = useResolveAlertMutation();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* ── Screen Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts Console</Text>
        {pendingCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} PENDING</Text>
          </View>
        ) : (
          <Text style={styles.headerSub}>All alerts resolved</Text>
        )}
      </View>

      {/* ── Alert List ──────────────────────────────────────────────────────── */}
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.alert_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={44} color="#2a9d8f" />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>
              No active alerts or device malfunctions in this hospital.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AlertCard
            item={item}
            canAcknowledge={canAcknowledgeAlerts}
            canResolve={canResolveAlerts}
            onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
            onResolve={(id) => resolveAlert.mutate(id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0c10' },

  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', flex: 1 },
  headerSub: { fontSize: 12, color: '#5a5c5e', fontWeight: '600' },
  pendingBadge: {
    backgroundColor: 'rgba(217,4,41,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '800', color: '#d90429' },

  list: { padding: 16, paddingTop: 4, paddingBottom: 80 },

  card: {
    backgroundColor: '#1a2130', borderRadius: 16, padding: 16,
    marginBottom: 12, borderLeftWidth: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertType: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontSize: 10, color: '#5a5c5e' },
  patientBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(102,252,241,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  message: { fontSize: 13, color: '#c5c6c7', lineHeight: 19, marginBottom: 12 },

  statusRow: { marginBottom: 14 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ackBtn: { backgroundColor: '#f77f00' },
  ackText: { color: '#0b0c10', fontSize: 12, fontWeight: '700' },
  resolveBtn: { backgroundColor: '#2a9d8f' },
  resolveText: { color: '#0b0c10', fontSize: 12, fontWeight: '700' },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  emptyText: {
    fontSize: 13, color: '#5a5c5e', textAlign: 'center',
    paddingHorizontal: 32, lineHeight: 18,
  },
});
