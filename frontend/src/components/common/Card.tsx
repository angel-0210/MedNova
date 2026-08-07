import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface CardProps extends ViewProps {
  variant?: 'neumorphic' | 'glass' | 'sterile';
}

export const Card: React.FC<CardProps> = ({
  variant = 'neumorphic',
  children,
  style,
  ...props
}) => {
  const { colors, roundness } = useTheme();

  if (variant === 'neumorphic') {
    return (
      <View
        style={[
          styles.neumorphicOuter,
          {
            borderRadius: roundness.lg,
            shadowColor: '#FFFFFF',
            shadowOffset: { width: -4, height: -4 },
            shadowOpacity: 1,
            shadowRadius: 10,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.base,
            {
              backgroundColor: colors.background,
              borderRadius: roundness.lg,
              shadowColor: '#000000',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }
          ]}
          {...props}
        >
          {children}
        </View>
      </View>
    );
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colors.surfaceGlass,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'sterile':
        return {
          backgroundColor: colors.backgroundMain,
          borderColor: colors.outlineVariant,
          borderWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        };
      default:
        return {};
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.base,
        variantStyles,
        {
          borderRadius: roundness.lg, // 20px (rounded-lg) for main containers
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: 24,
    overflow: 'hidden',
  },
  neumorphicOuter: {
    backgroundColor: 'transparent',
  },
});

