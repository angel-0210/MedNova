import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Card } from '../common/Card';
import { useTheme } from '../../theme/ThemeProvider';

interface VitalCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  minSafe: number;
  maxSafe: number;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  icon,
  minSafe,
  maxSafe,
}) => {
  const { colors, typography } = useTheme();
  
  const isAlert = value < minSafe || value > maxSafe;
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    if (isAlert) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1, // Loop forever
        true
      );
    } else {
      pulseValue.value = 0;
    }
  }, [isAlert, pulseValue]);

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: isAlert ? colors.statusCritical : 'transparent',
      borderWidth: 2,
    };
  });

  return (
    <Card variant="neumorphic" style={styles.card}>
      <Animated.View style={[styles.pulseContainer, borderAnimatedStyle]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>{icon}</View>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>
            {label}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text
            style={[
              typography.statsXl,
              {
                color: isAlert ? colors.statusCritical : colors.primary,
                fontWeight: 'bold',
              },
            ]}
          >
            {value.toFixed(1)}
          </Text>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, marginLeft: 4, marginBottom: 4 }]}>
            {unit}
          </Text>
        </View>
      </Animated.View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    flex: 1,
    minHeight: 140,
  },
  pulseContainer: {
    padding: 16,
    flex: 1,
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
  },
});
