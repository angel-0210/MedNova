import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAlertStore, usePatientStore } from '../stores';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useTheme } from '../theme/ThemeProvider';
import { useRoleAccess } from '../hooks/useRoleAccess';

export const Alerts: React.FC = () => {
  const { colors, typography } = useTheme();
  const { activeAlerts, fetchActiveAlerts, acknowledge, resolve } = useAlertStore();
  const { patients, fetchPatients } = usePatientStore();
  const { canAcknowledgeAlerts, canResolveAlerts } = useRoleAccess();

  useEffect(() => {
    fetchActiveAlerts();
    fetchPatients();
  }, [fetchActiveAlerts, fetchPatients]);

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    return patient ? patient.name : 'Unknown Patient';
  };

  const getBedNumber = (patientId: string) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    return patient?.bed_number ? `Bed ${patient.bed_number}` : 'No Bed';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          Clinical Alerts
        </Text>
      </View>

      <FlatList
        data={activeAlerts}
        keyExtractor={(item) => item.alert_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card 
            variant="neumorphic" 
            style={[
              styles.alertCard, 
              { borderLeftColor: item.alert_type === 'critical' ? colors.statusCritical : colors.secondaryContainer }
            ]}
          >
            <View style={styles.alertHeader}>
              <View>
                <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
                  {getPatientName(item.patient_id)}
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  {getBedNumber(item.patient_id)} • ICU Ward
                </Text>
              </View>
              <Badge type={item.alert_type === 'critical' ? 'critical' : 'warning'} label={item.alert_type} />
            </View>

            <Text style={[typography.bodySm, { color: colors.onSurface, marginTop: 8 }]}>
              {item.message}
            </Text>

            <View style={styles.alertActions}>
              {item.status === 'pending' && canAcknowledgeAlerts && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                  onPress={() => acknowledge(item.alert_id)}
                >
                  <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 10 }]}>Acknowledge</Text>
                </TouchableOpacity>
              )}
              {canResolveAlerts && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => resolve(item.alert_id)}
                >
                  <Text style={[typography.labelCaps, { color: '#ffffff', fontSize: 10 }]}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              No active clinical alerts at this time.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  alertCard: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
