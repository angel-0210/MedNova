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
import { theme } from '../../../constants/theme';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  online:      { color: '#2a9d8f', bg: 'rgba(42,157,143,0.15)',  label: 'Online' },
  offline:     { color: theme.colors.error, bg: theme.colors.errorContainer,    label: 'Offline' },
  maintenance: { color: theme.colors.statusStable, bg: theme.colors.surfaceContainer,   label: 'Maintenance' },
  error:       { color: theme.colors.error, bg: theme.colors.errorContainer,    label: 'Error' },
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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <AlertCircle size={40} color={theme.colors.error} />
        <Text style={[styles.errorTitle, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>Device Not Found</Text>
        <Text style={[styles.errorText, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>This gateway may have been removed or is not accessible.</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.colors.primary }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, theme.typography.bodySm, { color: theme.colors.onPrimary, fontWeight: '700' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.offline;
  const batteryColor = device.battery_level != null && device.battery_level < 20 ? theme.colors.error : theme.colors.statusStable;
  const batteryPct = device.battery_level ?? null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Status Header ─────────────────────────────────────────────────── */}
      <View style={[styles.statusHeader, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
        <View style={[styles.statusIndicator, { backgroundColor: 'rgba(0,10,36,0.05)' }]}>
          <Wifi size={28} color={statusCfg.color} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.macAddress, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>{device.mac_address}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusLabel, theme.typography.labelCaps, { color: statusCfg.color, fontWeight: '800' }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      {/* ── Detail Cards ─────────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Device Information</Text>
      <View style={[styles.detailCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>

        <DetailRow
          icon={<Hash size={14} color={theme.colors.primary} />}
          label="Connection Code"
          value={device.connection_code}
          mono
        />
        <Sep />
        <DetailRow
          icon={<Cpu size={14} color={theme.colors.primary} />}
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
          icon={<Clock size={14} color={theme.colors.primary} />}
          label="Last Ping"
          value={device.last_ping
            ? new Date(device.last_ping).toLocaleString()
            : 'Never'}
        />

      </View>

      {/* ── Battery Bar ──────────────────────────────────────────────────── */}
      {batteryPct != null && (
        <>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Battery Status</Text>
          <View style={[styles.batteryCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <View style={[styles.batteryBarBg, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
              <View style={[
                styles.batteryBarFill,
                {
                  width: `${batteryPct}%` as any,
                  backgroundColor: batteryPct < 20 ? theme.colors.error : batteryPct < 50 ? theme.colors.secondaryContainer : theme.colors.statusStable,
                },
              ]} />
            </View>
            <Text style={[styles.batteryPct, theme.typography.bodySm, { color: batteryColor, fontWeight: '700' }]}>{batteryPct}% charged</Text>
          </View>
        </>
      )}

      {/* ── Danger Zone (clinicians only) ─────────────────────────────────── */}
      {canUnpairDevices && (
        <>
          <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.error }]}>Actions</Text>
          <TouchableOpacity style={[styles.dangerBtn, { borderColor: theme.colors.error }]} onPress={handleUnpair} activeOpacity={0.8}>
            <Link2Off size={18} color={theme.colors.error} />
            <Text style={[styles.dangerBtnText, theme.typography.bodySm, { color: theme.colors.error, fontWeight: '700' }]}>Disconnect from Patient</Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Sep = () => <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant + '33', marginHorizontal: 4 }} />;

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, mono, valueColor }) => (
  <View style={styles.detailRow}>
    <View style={[styles.detailIcon, { backgroundColor: 'rgba(0,10,36,0.05)' }]}>{icon}</View>
    <Text style={[styles.detailLabel, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    <Text style={[styles.detailValue, theme.typography.bodySm, mono && styles.mono, { color: valueColor ? valueColor : theme.colors.primary, fontWeight: '700' }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 60 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12,
  },

  statusHeader: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 28, borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statusIndicator: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  macAddress: { fontFamily: 'monospace', marginBottom: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  sectionTitle: {
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },

  detailCard: {
    borderRadius: 20, marginBottom: 24,
    borderWidth: 1,
    paddingVertical: 4, overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  detailIcon: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { flex: 1 },
  detailValue: { },
  mono: { fontFamily: 'monospace' },

  batteryCard: {
    borderRadius: 20, padding: 16,
    marginBottom: 24, borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  batteryBarBg: {
    height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8,
  },
  batteryBarFill: { height: '100%', borderRadius: 5 },
  batteryPct: { },

  dangerBtn: {
    borderWidth: 1,
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20,
  },
  dangerBtnText: { },

  errorTitle: { marginTop: 4 },
  errorText: { textAlign: 'center', lineHeight: 18 },
  backBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { },
});
