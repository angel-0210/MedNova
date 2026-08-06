import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { usePatientsQuery } from '@mednova/hooks';
import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PatientsScreen() {
  const { data: patients = [], isLoading } = usePatientsQuery();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patient_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No registered ICU patients found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({
              pathname: '/(app)/patient/[id]',
              params: { id: item.patient_id }
            })}
          >
            <View style={styles.cardContent}>
              <View style={styles.header}>
                <Text style={styles.name}>{item.name}</Text>
                <span style={[styles.badge, {
                  backgroundColor: item.ventilator_status === 'active' ? 'rgba(42, 157, 143, 0.15)' : 'rgba(255,255,255,0.05)',
                  color: item.ventilator_status === 'active' ? '#2a9d8f' : '#8f9091'
                }]}>
                  {item.ventilator_status.toUpperCase()}
                </span>
              </View>
              <Text style={styles.details}>
                Bed {item.bed_number || 'N/A'} • {item.gender} • {item.age} years old
              </Text>
            </View>
            <ChevronRight size={18} color="#8f9091" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0c10',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  badge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  details: {
    fontSize: 12,
    color: '#8f9091',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8f9091',
    fontSize: 14,
  },
});
