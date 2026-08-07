import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDevicesQuery, useUnpairDeviceMutation } from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { Wifi, AlertCircle, ChevronRight, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { Device } from '@mednova/types';
import { theme } from '../../../constants/theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  online:      { bg: theme.colors.statusStable,  text: '#ffffff' },
  offline:     { bg: theme.colors.statusCritical,    text: '#ffffff' },
  maintenance: { bg: theme.colors.surfaceContainer,   text: theme.colors.primary },
  error:       { bg: theme.colors.statusCritical,    text: '#ffffff' },
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
      style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
      onPress={() => onNavigate(item.device_id)}
      activeOpacity={0.8}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.macRow}>
          <View style={[styles.deviceIcon, { backgroundColor: 'rgba(0,10,36,0.05)' }]}>
            <Wifi size={16} color={item.status === 'online' ? theme.colors.statusStable : theme.colors.outline} />
          </View>
          <Text style={[styles.mac, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>{item.mac_address}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, theme.typography.labelCaps, { color: statusStyle.text, fontSize: 9, fontWeight: '800' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Details grid */}
      <View style={styles.detailRow}>
        <View style={styles.detailCell}>
          <Text style={[styles.detailLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Connection Code</Text>
          <Text style={[styles.detailVal, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>{item.connection_code}</Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={[styles.detailLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Battery</Text>
          <Text style={[styles.detailVal, theme.typography.bodySm, {
            fontWeight: '700',
            color: (item.battery_level ?? 100) < 20 ? theme.colors.error : theme.colors.primary,
          }]}>
            {item.battery_level != null ? `${item.battery_level}%` : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailCell}>
          <Text style={[styles.detailLabel, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Firmware</Text>
          <Text style={[styles.detailVal, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>{item.firmware_version ?? 'N/A'}</Text>
        </View>
      </View>

      {/* Footer row */}
      <View style={styles.cardFooter}>
        {canUnpair && (
          <TouchableOpacity
            style={[styles.unpairBtn, { borderColor: theme.colors.error }]}
            onPress={() => onUnpair(item.device_id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.unpairText, theme.typography.bodySm, { color: theme.colors.error, fontWeight: '700' }]}>Disconnect</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.detailBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => onNavigate(item.device_id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.detailBtnText, theme.typography.bodySm, { color: theme.colors.onPrimary, fontWeight: '700' }]}>Details</Text>
          <ChevronRight size={12} color={theme.colors.onPrimary} />
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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const onlineCount  = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status !== 'online').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* ── Screen Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>IoT Gateways</Text>
          <Text style={[styles.headerSub, theme.typography.bodySm]}>
            <Text style={{ color: '#2a9d8f', fontWeight: '700' }}>{onlineCount} online</Text>
            {offlineCount > 0 && <Text style={{ color: theme.colors.error, fontWeight: '700' }}> · {offlineCount} offline</Text>}
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
            <AlertCircle size={40} color={theme.colors.outline} />
            <Text style={[styles.emptyTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '800' }]}>No Devices Registered</Text>
            <Text style={[styles.emptyText, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
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
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} activeOpacity={0.85}>
          <Plus size={22} color={theme.colors.onPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { },
  headerSub: { },

  list: { padding: 16, paddingTop: 4, paddingBottom: 100 },

  card: {
    borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
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
  mac: { fontFamily: 'monospace', flex: 1 },
  statusBadge: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },

  detailRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  detailCell: { flex: 1 },
  detailLabel: { textTransform: 'uppercase', marginBottom: 3 },
  detailVal: { },

  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  unpairBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1,
  },
  unpairText: { },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  detailBtnText: { },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 12,
  },
  emptyTitle: { },
  emptyText: {
    paddingHorizontal: 32, lineHeight: 18,
  },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
});
