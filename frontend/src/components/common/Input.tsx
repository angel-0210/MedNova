import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const { colors, typography, roundness } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 6 }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderRadius: roundness.md, // 12px for inputs
            borderColor: error ? colors.error : colors.outlineVariant,
            borderWidth: 1,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.onSurfaceVariant + '80'}
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
      </View>
      {error && (
        <Text style={[typography.bodySm, { color: colors.error, marginTop: 4 }]}>
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
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
