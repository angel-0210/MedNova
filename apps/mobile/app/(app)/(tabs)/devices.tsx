import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useDevicesQuery, useUnpairDeviceMutation } from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { Wifi, AlertCircle, ChevronRight, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { Device } from '@mednova/types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  online:      { bg: 'rgba(42,157,143,0.15)',  text: '#2a9d8f' },
  offline:     { bg: 'rgba(217,4,41,0.12)',    text: '#d90429' },
  maintenance: { bg: 'rgba(247,127,0,0.15)',   text: '#f77f00' },
  error:       { bg: 'rgba(217,4,41,0.12)',    text: '#d90429' },
};

const DeviceCard: React.FC<{
  item: Device;
  canUnpair: boolean;
  onNavigate: (id: string) => void;
  onUnpair: (id: string) => void;
}> = ({ item, canUnpair, onNavigate, onUnpair }) => {
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.offline;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onNavigate(item.device_id)}
      activeOpacity={0.8}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.macRow}>
          <View style={[styles.deviceIcon, { backgroundColor: item.status === 'online' ? 'rgba(102,252,241,0.1)' : 'rgba(90,92,94,0.15)' }]}>
            <Wifi size={16} color={item.status === 'online' ? '#66fcf1' : '#5a5c5e'} />
          </View>
          <Text style={styles.mac}>{item.mac_address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.detailRow}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Connection Code</Text>
          <Text style={styles.detailVal}>{item.connection_code}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Battery</Text>
          <Text style={[styles.detailVal, {
            color: (item.battery_level ?? 100) < 20 ? '#d90429' : '#ffffff',
          }]}>
            {item.battery_level != null ? `${item.battery_level}%` : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Firmware</Text>
          <Text style={styles.detailVal}>{item.firmware_version ?? 'N/A'}</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.cardFooter}>
        {canUnpair && (
          <TouchableOpacity
            style={styles.unpairBtn}
            onPress={() => onUnpair(item.device_id)}
            activeOpacity={0.8}
          >
            <Text style={styles.unpairText}>Disconnect</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => onNavigate(item.device_id)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailBtnText}>Details</Text>
          <ChevronRight size={12} color="#66fcf1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function DevicesScreen() {
  const { data: devices = [], isLoading, refetch } = useDevicesQuery();
  const { canUnpairDevices, canRegisterDevices } = useRBAC();
  const unpairDevice = useUnpairDeviceMutation();

  const handleUnpair = (deviceId: string) => {
    Alert.alert(
      'Disconnect Gateway',
      'Are you sure you want to disconnect this device from its patient assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await unpairDevice.mutateAsync(deviceId);
              refetch();
            } catch {
              Alert.alert('Error', 'Failed to disconnect gateway. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNavigate = (deviceId: string) => {
    router.push({ pathname: '/(app)/device/[id]', params: { id: deviceId } });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  const onlineCount  = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status !== 'online').length;

  return (
    <View style={styles.container}>
      {/* ── Screen Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>IoT Gateways</Text>
          <Text style={styles.headerSub}>
            <Text style={{ color: '#2a9d8f' }}>{onlineCount} online</Text>
            {offlineCount > 0 && <Text style={{ color: '#d90429' }}> · {offlineCount} offline</Text>}
          </Text>
        </View>
      </View>

      {/* ── Device List ─────────────────────────────────────────────────────── */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.device_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={40} color="#2a2e36" />
            <Text style={styles.emptyTitle}>No Devices Registered</Text>
            <Text style={styles.emptyText}>
              {canRegisterDevices
                ? 'Use the + button to register a telemetry gateway.'
                : 'No telemetry gateways have been registered by your administrator.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DeviceCard
            item={item}
            canUnpair={canUnpairDevices}
            onNavigate={handleNavigate}
            onUnpair={handleUnpair}
          />
        )}
      />

      {/* ── FAB: Register Device (admin only) ──────────────────────────────── */}
      {canRegisterDevices && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <Plus size={22} color="#0b0c10" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0c10' },

  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, marginTop: 2, fontWeight: '600' },

  list: { padding: 16, paddingTop: 4, paddingBottom: 100 },

  card: {
    backgroundColor: '#1a2130', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  macRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  deviceIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  mac: { fontSize: 13, fontWeight: '700', color: '#ffffff', fontFamily: 'monospace', flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },

  detailRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  detailCell: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '600', color: '#5a5c5e', textTransform: 'uppercase', marginBottom: 3 },
  detailVal: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  unpairBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(217,4,41,0.1)',
    borderWidth: 1, borderColor: 'rgba(217,4,41,0.2)',
  },
  unpairText: { color: '#d90429', fontSize: 12, fontWeight: '700' },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(102,252,241,0.08)',
  },
  detailBtnText: { color: '#66fcf1', fontSize: 12, fontWeight: '700' },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#3a3e46' },
  emptyText: {
    fontSize: 13, color: '#3a3e46', textAlign: 'center',
    paddingHorizontal: 32, lineHeight: 18,
  },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#66fcf1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#66fcf1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
});
