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

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colors.surfaceGlass,
          borderColor: 'rgba(255, 255, 255, 0.2)',
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
        // Neumorphic style: soft dual shadow simulation in React Native
        return {
          backgroundColor: colors.background,
          borderColor: 'transparent',
          borderWidth: 0,
          // iOS Neumorphic shadows
          shadowColor: '#000000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          // Android elevation fallback
          elevation: 2,
        };
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
    padding: 16,
    overflow: 'hidden',
  },
});
