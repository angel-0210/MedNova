import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type BadgeType = 'critical' | 'stable' | 'warning' | 'device';

interface BadgeProps {
  label: string;
  type?: BadgeType;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'stable',
}) => {
  const { colors, typography, roundness } = useTheme();

  const getBadgeColors = () => {
    switch (type) {
      case 'critical':
        return {
          bg: colors.statusCritical, // #FCA311 (Safety Orange)
          text: '#ffffff',
        };
      case 'warning':
        return {
          bg: colors.surfaceContainer, // #eeeeee (Light Gray)
          text: colors.statusStable, // #14213D (Deep Navy)
        };
      case 'device':
        return {
          bg: colors.surfaceContainerHighest, // #e2e2e2
          text: colors.primary, // #000a24
        };
      default:
        return {
          bg: colors.statusStable, // #14213D (Deep Navy)
          text: '#ffffff',
        };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderRadius: roundness.full,
        },
      ]}
    >
      <Text
        style={[
          typography.labelCaps,
          {
            color: text,
            fontSize: 10,
            textTransform: 'uppercase',
            fontWeight: 'bold',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

