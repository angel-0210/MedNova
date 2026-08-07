import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDevicesQuery, useUnpairDeviceMutation } from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import {
  Wifi, Battery, Cpu, Hash, Clock,
  AlertCircle, Link2Off,
} from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  online:      { color: '#2a9d8f', bg: 'rgba(42,157,143,0.15)',  label: 'Online' },
  offline:     { color: '#d90429', bg: 'rgba(217,4,41,0.15)',    label: 'Offline' },
  maintenance: { color: '#f77f00', bg: 'rgba(247,127,0,0.15)',   label: 'Maintenance' },
  error:       { color: '#d90429', bg: 'rgba(217,4,41,0.15)',    label: 'Error' },
};

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: devices = [], isLoading } = useDevicesQuery();
  const { canUnpairDevices } = useRBAC();
  const unpairDevice = useUnpairDeviceMutation();

  const device = devices.find((d) => d.device_id === id);

  const handleUnpair = () => {
    Alert.alert(
      'Disconnect Gateway',
      'This will remove the device from its current patient assignment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await unpairDevice.mutateAsync(device!.device_id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to disconnect gateway. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <AlertCircle size={40} color="#d90429" />
        <Text style={styles.errorTitle}>Device Not Found</Text>
        <Text style={styles.errorText}>This gateway may have been removed or is not accessible.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.offline;
  const batteryColor = device.battery_level != null && device.battery_level < 20 ? '#d90429' : '#66fcf1';
  const batteryPct = device.battery_level ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Status Header ─────────────────────────────────────────────────── */}
      <View style={styles.statusHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: statusCfg.bg }]}>
          <Wifi size={28} color={statusCfg.color} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.macAddress}>{device.mac_address}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      {/* ── Detail Cards ─────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Device Information</Text>
      <View style={styles.detailCard}>

        <DetailRow
          icon={<Hash size={14} color="#66fcf1" />}
          label="Connection Code"
          value={device.connection_code}
          mono
        />
        <Sep />
        <DetailRow
          icon={<Cpu size={14} color="#66fcf1" />}
          label="Firmware Version"
          value={device.firmware_version ?? 'Not reported'}
        />
        <Sep />
        <DetailRow
          icon={<Battery size={14} color={batteryColor} />}
          label="Battery Level"
          value={batteryPct != null ? `${batteryPct}%` : 'Not reported'}
          valueColor={batteryColor}
        />
        <Sep />
        <DetailRow
          icon={<Clock size={14} color="#66fcf1" />}
          label="Last Ping"
          value={device.last_ping
            ? new Date(device.last_ping).toLocaleString()
            : 'Never'}
        />

      </View>

      {/* ── Battery Bar ──────────────────────────────────────────────────── */}
      {batteryPct != null && (
        <>
          <Text style={styles.sectionTitle}>Battery Status</Text>
          <View style={styles.batteryCard}>
            <View style={styles.batteryBarBg}>
              <View style={[
                styles.batteryBarFill,
                {
                  width: `${batteryPct}%` as any,
                  backgroundColor: batteryPct < 20 ? '#d90429' : batteryPct < 50 ? '#f77f00' : '#2a9d8f',
                },
              ]} />
            </View>
            <Text style={[styles.batteryPct, { color: batteryColor }]}>{batteryPct}% charged</Text>
          </View>
        </>
      )}

      {/* ── Danger Zone (clinicians only) ─────────────────────────────────── */}
      {canUnpairDevices && (
        <>
          <Text style={[styles.sectionTitle, { color: '#d90429' }]}>Actions</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleUnpair} activeOpacity={0.8}>
            <Link2Off size={18} color="#d90429" />
            <Text style={styles.dangerBtnText}>Disconnect from Patient</Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Sep = () => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 4 }} />;

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, mono, valueColor }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && styles.mono, valueColor ? { color: valueColor } : undefined]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  scroll: { padding: 20, paddingBottom: 60 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0b0c10', padding: 32, gap: 12,
  },

  statusHeader: {
    backgroundColor: '#1a2130', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  statusIndicator: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  macAddress: { fontSize: 15, fontWeight: '800', color: '#ffffff', fontFamily: 'monospace', marginBottom: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#5a5c5e',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },

  detailCard: {
    backgroundColor: '#1a2130', borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 4, overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  detailIcon: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: 'rgba(102,252,241,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: 13, color: '#8f9091', flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  mono: { fontFamily: 'monospace' },

  batteryCard: {
    backgroundColor: '#1a2130', borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  batteryBarBg: {
    height: 10, backgroundColor: '#252b36', borderRadius: 5, overflow: 'hidden', marginBottom: 8,
  },
  batteryBarFill: { height: '100%', borderRadius: 5 },
  batteryPct: { fontSize: 13, fontWeight: '700' },

  dangerBtn: {
    backgroundColor: 'rgba(217,4,41,0.08)',
    borderWidth: 1, borderColor: 'rgba(217,4,41,0.2)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20,
  },
  dangerBtnText: { fontSize: 15, fontWeight: '700', color: '#d90429' },

  errorTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  errorText: { fontSize: 13, color: '#5a5c5e', textAlign: 'center', lineHeight: 18 },
  backBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#1a2130', borderRadius: 12,
  },
  backBtnText: { color: '#66fcf1', fontWeight: '700', fontSize: 14 },
});
