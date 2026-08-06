import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { 
  useAlertsQuery, useAcknowledgeAlertMutation, 
  useResolveAlertMutation 
} from '@mednova/hooks';
import { ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { formatDateTime } from '@mednova/utils';

export default function AlertsScreen() {
  const { data: alerts = [], isLoading } = useAlertsQuery();
  const acknowledgeAlert = useAcknowledgeAlertMutation();
  const resolveAlert = useResolveAlertMutation();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.alert_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={36} color="#2a9d8f" />
            <Text style={styles.emptyTitle}>All Clean</Text>
            <Text style={styles.emptyText}>No active patient alerts or hardware malfunctions reported.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[
            styles.card, 
            item.alert_type === 'critical' ? styles.criticalBorder : styles.warningBorder
          ]}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <ShieldAlert 
                  size={18} 
                  color={item.alert_type === 'critical' ? '#d90429' : '#f77f00'} 
                />
                <Text style={styles.alertType}>{item.alert_type.toUpperCase()} ALERT</Text>
              </View>
              <Text style={styles.time}>{formatDateTime(item.created_at)}</Text>
            </View>

            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.status}>Status: <Text style={{ color: '#ffffff' }}>{item.status.toUpperCase()}</Text></Text>

            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.button, styles.ackButton]}
                  onPress={() => acknowledgeAlert.mutate(item.alert_id)}
                >
                  <Text style={styles.ackText}>Acknowledge</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.button, styles.resolveButton]}
                onPress={() => resolveAlert.mutate(item.alert_id)}
              >
                <Text style={styles.resolveText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0c10',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  criticalBorder: {
    borderLeftColor: '#d90429',
    backgroundColor: 'rgba(217, 4, 41, 0.05)',
  },
  warningBorder: {
    borderLeftColor: '#f77f00',
    backgroundColor: 'rgba(247, 127, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 10,
    color: '#8f9091',
  },
  message: {
    fontSize: 13,
    color: '#c5c6c7',
    lineHeight: 18,
    marginBottom: 12,
  },
  status: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8f9091',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackButton: {
    backgroundColor: '#f77f00',
  },
  ackText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: '700',
  },
  resolveButton: {
    backgroundColor: '#2a9d8f',
  },
  resolveText: {
    color: '#0b0c10',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyText: {
    color: '#8f9091',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
