import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Device } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface VentilatorStatusCardProps {
  device: Device;
}

export const VentilatorStatusCard: React.FC<VentilatorStatusCardProps> = ({
  device,
}) => {
  const { colors, typography } = useTheme();

  const getStatusType = () => {
    switch (device.status) {
      case 'online':
        return 'stable';
      case 'maintenance':
        return 'warning';
      case 'error':
        return 'critical';
      default:
        return 'device';
    }
  };

  return (
    <Card variant="neumorphic" style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
            Ventilator Node ({device.connection_code})
          </Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
            MAC: {device.mac_address}
          </Text>
        </View>
        <Badge type={getStatusType()} label={device.status} />
      </View>

      <View style={styles.vitalsGrid}>
        <View style={styles.vitalCol}>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>
            Battery
          </Text>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
            {device.battery_level !== undefined ? `${device.battery_level}%` : 'N/A'}
          </Text>
        </View>

        <View style={styles.vitalCol}>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>
            Firmware
          </Text>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
            v{device.firmware_version || '1.0.0'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 12,
    gap: 24,
  },
  vitalCol: {
    flexDirection: 'column',
  },
});
