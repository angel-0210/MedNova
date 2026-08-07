import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart2 } from 'lucide-react-native';
import { theme } from '../../constants/theme';

export default function AnalyticsScreen() {
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <BarChart2 size={24} color={theme.colors.primary} />
        <Text style={[styles.title, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>Clinical Analytics</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.cardTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>Ventilator Volume Compliance</Text>
        <Text style={[styles.cardDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>System compliance levels over the last 7 days average 94.6%.</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.cardTitle, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]}>Weaning Outcome Forecasts</Text>
        <Text style={[styles.cardDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>AI predicts high success ratios (88%) for current active weaning pipelines.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardDesc: {
    lineHeight: 18,
  },
});
