import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Patient } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';
import { TrendingDown, TrendingUp } from 'lucide-react-native';

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
  riskScore?: number;
  spo2?: number;
  heartRate?: number;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress,
  riskScore = 10,
  spo2 = 96,
  heartRate = 72,
}) => {
  const { colors, typography } = useTheme();

  const isCritical = riskScore >= 75;
  const isElevated = riskScore >= 50 && riskScore < 75;

  const getRiskType = () => {
    if (isCritical) return 'critical';
    if (isElevated) return 'warning';
    return 'stable';
  };

  const getRiskLabel = () => {
    if (isCritical) return 'Critical Risk';
    if (isElevated) return 'Elevated Risk';
    return 'Stable';
  };

  const accentColor = isCritical ? colors.statusCritical : colors.statusStable;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card variant="neumorphic" style={[styles.card, { borderLeftColor: accentColor }]}>
        <View style={styles.content}>
          
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.nameSection}>
              <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: '700' }]}>
                {patient.name}
              </Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} yrs
              </Text>
            </View>
            <Badge type={getRiskType()} label={getRiskLabel()} />
          </View>

          {/* Vitals Telemetry Grid */}
          <View style={styles.vitalsSection}>
            {/* SpO2 */}
            <View style={styles.vitalItem}>
              <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9 }]}>
                SPO2
              </Text>
              <View style={styles.vitalValueRow}>
                <Text style={[
                  styles.vitalValueText, 
                  { color: spo2 < 93 ? colors.statusCritical : colors.primary }
                ]}>
                  {spo2}<Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>%</Text>
                </Text>
                {spo2 < 93 ? (
                  <TrendingDown size={14} color={colors.statusCritical} style={styles.trendIcon} />
                ) : (
                  <TrendingUp size={14} color={colors.statusStable} style={styles.trendIcon} />
                )}
              </View>
            </View>

            {/* Pulse Rate */}
            <View style={[styles.vitalItem, styles.vitalItemBorder]}>
              <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9 }]}>
                PULSE
              </Text>
              <View style={styles.vitalValueRow}>
                <Text style={[styles.vitalValueText, { color: colors.primary }]}>
                  {heartRate}<Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>bpm</Text>
                </Text>
                <TrendingUp size={14} color={colors.statusStable} style={styles.trendIcon} />
              </View>
            </View>
          </View>

          {/* Critical Warning Box */}
          {isCritical && (
            <View style={[styles.warningBox, { backgroundColor: colors.statusCritical + '1A', borderColor: colors.statusCritical }]}>
              <Text style={[styles.warningText, { color: colors.statusCritical }]}>
                Desaturation detected. Review ventilation settings.
              </Text>
            </View>
          )}

          {/* Footer Metadata */}
          <View style={styles.footer}>
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 10 }]}>
              VENTILATOR: {patient.ventilator_status.toUpperCase()}
            </Text>
            <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold', fontSize: 10 }]}>
              RISK SCORE: {riskScore}%
            </Text>
          </View>

        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 16,
    borderLeftWidth: 5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  vitalsSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  vitalItem: {
    flex: 1,
  },
  vitalItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 16,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  vitalValueText: {
    fontSize: 22,
    fontWeight: '700',
  },
  trendIcon: {
    marginLeft: 6,
  },
  warningBox: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
});

