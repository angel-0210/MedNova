import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightElement,
  style,
  ...props
}) => {
  const { colors, typography, roundness } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 8, marginLeft: 4 }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceContainerHighest, // #e2e2e2 for neumorphic recessed look
            borderRadius: roundness.md, // 12px (soft) radius for interactive elements
            borderColor: error ? colors.error : 'transparent',
            borderWidth: error ? 1 : 0,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.outline}
          style={[
            styles.input,
            typography.bodyMd,
            {
              color: colors.onSurface,
            },
            style,
          ]}
          {...props}
        />
        {rightElement && <View style={styles.rightElementContainer}>{rightElement}</View>}
      </View>
      {error && (
        <Text style={[typography.bodySm, { color: colors.error, marginTop: 4, marginLeft: 4 }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54, // standard height for clinical inputs
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElementContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
});

