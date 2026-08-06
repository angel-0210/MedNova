import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

export const About: React.FC = () => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold', marginBottom: 16 }]}>
        About MedNova
      </Text>
      
      <Card variant="sterile" style={styles.card}>
        <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>MedNova Platform</Text>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
          Version 1.0.0 (Production Build)
        </Text>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
          Certified Medical Device Integration Layer. Engineered for safe, reliable bedside ventilator monitoring.
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
