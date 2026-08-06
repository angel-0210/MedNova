import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IoT Gateway Config</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
      <Text style={styles.info}>All connected sensors for this ventilator node are online and reporting.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#66fcf1',
    marginTop: 8,
  },
  info: {
    fontSize: 12,
    color: '#8f9091',
    marginTop: 16,
    textAlign: 'center',
  },
});
