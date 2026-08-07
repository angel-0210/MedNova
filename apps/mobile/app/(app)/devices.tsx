import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { useDevicesQuery, useUnpairDeviceMutation } from '@mednova/hooks';
import { Wifi, AlertCircle } from 'lucide-react-native';

export default function DevicesScreen() {
  const { data: devices = [], isLoading, refetch } = useDevicesQuery();
  const unpairDevice = useUnpairDeviceMutation();

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
        data={devices}
        keyExtractor={(item) => item.device_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={32} color="#8f9091" />
            <Text style={styles.emptyText}>No paired telemetry devices found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.macContainer}>
                <Wifi size={16} color="#66fcf1" />
                <Text style={styles.macText}>{item.mac_address}</Text>
              </View>
              <Text style={[styles.statusBadge, {
                backgroundColor: item.status === 'online' ? 'rgba(42, 157, 143, 0.15)' : 'rgba(217, 4, 41, 0.15)',
                color: item.status === 'online' ? '#2a9d8f' : '#d90429'
              }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View>
                <Text style={styles.label}>Connection Code</Text>
                <Text style={styles.val}>{item.connection_code}</Text>
              </View>
              <View>
                <Text style={styles.label}>Battery Level</Text>
                <Text style={styles.val}>{item.battery_level ? `${item.battery_level}%` : 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.unpairButton}
              onPress={async () => {
                try {
                  await unpairDevice.mutateAsync(item.device_id);
                  refetch();
                  alert('Gateway disconnected');
                } catch {
                  alert('Failed to unpair gateway');
                }
              }}
            >
              <Text style={styles.unpairText}>Disconnect Gateway</Text>
            </TouchableOpacity>
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  macContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8f9091',
    textTransform: 'uppercase',
  },
  val: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  unpairButton: {
    backgroundColor: 'rgba(217, 4, 41, 0.1)',
    borderColor: 'rgba(217, 4, 41, 0.15)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  unpairText: {
    color: '#d90429',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#8f9091',
    fontSize: 14,
  },
});
