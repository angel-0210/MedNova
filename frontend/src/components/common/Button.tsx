import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  disabled,
  ...props
}) => {
  const { colors, typography, roundness } = useTheme();

  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          textColor: colors.primary,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 1.5,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          textColor: colors.onError,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.onPrimary,
          borderColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  const { backgroundColor, textColor, borderColor, borderWidth } = getButtonStyles();

  const height = size === 'small' ? 36 : size === 'large' ? 56 : 48;
  const paddingHorizontal = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const fontSize = size === 'small' ? typography.bodySm.fontSize : typography.bodyMd.fontSize;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          height,
          paddingHorizontal,
          borderRadius: roundness.md, // 12px for interactive elements
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            typography.labelCaps,
            {
              color: textColor,
              fontSize,
              textAlign: 'center',
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});
