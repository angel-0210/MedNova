import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart2 } from 'lucide-react-native';

export default function AnalyticsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <BarChart2 size={24} color="#66fcf1" />
        <Text style={styles.title}>Clinical Analytics</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ventilator Volume Compliance</Text>
        <Text style={styles.cardDesc}>System compliance levels over the last 7 days average 94.6%.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weaning Outcome Forecasts</Text>
        <Text style={styles.cardDesc}>AI predicts high success ratios (88%) for current active weaning pipelines.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#8f9091',
    lineHeight: 18,
  },
});
