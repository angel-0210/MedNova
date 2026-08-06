import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

export const Help: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold', marginBottom: 16 }]}>
        Clinical Help & Support
      </Text>
      
      <Card variant="neumorphic" style={styles.card}>
        <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>Emergency Contact</Text>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
          For system failures, call clinical tech support at extension 4900 immediately.
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});
