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
          bg: colors.statusCritical,
          text: '#ffffff',
        };
      case 'warning':
        return {
          bg: colors.secondaryContainer,
          text: '#000000',
        };
      case 'device':
        return {
          bg: colors.surfaceContainerHigh,
          text: colors.primary,
        };
      default:
        return {
          bg: colors.statusStable,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
