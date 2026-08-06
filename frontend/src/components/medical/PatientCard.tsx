import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Patient } from '../../types';
import { useTheme } from '../../theme/ThemeProvider';

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
  riskScore?: number;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress,
  riskScore = 10,
}) => {
  const { colors, typography } = useTheme();

  const getRiskType = () => {
    if (riskScore >= 75) return 'critical';
    if (riskScore >= 50) return 'warning';
    return 'stable';
  };

  const getRiskLabel = () => {
    if (riskScore >= 75) return 'Critical Risk';
    if (riskScore >= 50) return 'Elevated Risk';
    return 'Stable';
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card variant="neumorphic" style={styles.card}>
        <View style={styles.leftBar} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
                {patient.name}
              </Text>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                Bed {patient.bed_number || 'N/A'} • {patient.gender} • {patient.age} yrs
              </Text>
            </View>
            <Badge type={getRiskType()} label={getRiskLabel()} />
          </View>
          
          <View style={styles.footer}>
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>
              Ventilator: {patient.ventilator_status.toUpperCase()}
            </Text>
            <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold' }]}>
              Risk Score: {riskScore}%
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
    flexDirection: 'row',
    marginBottom: 12,
    position: 'relative',
  },
  leftBar: {
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#14213D',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
  },
});
