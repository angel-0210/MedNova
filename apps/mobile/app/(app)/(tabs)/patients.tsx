import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { usePatientsQuery } from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { ChevronRight, Users, UserPlus } from 'lucide-react-native';
import { router } from 'expo-router';

const VENTILATOR_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:  { bg: 'rgba(42,157,143,0.15)', text: '#2a9d8f' },
  weaning: { bg: 'rgba(247,127,0,0.15)',  text: '#f77f00' },
  off:     { bg: 'rgba(90,92,94,0.2)',    text: '#5a5c5e' },
};

export default function PatientsScreen() {
  const { data: patients = [], isLoading } = usePatientsQuery();
  const { canEditPatients } = useRBAC();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Screen Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Registry</Text>
        <Text style={styles.headerSub}>{patients.length} registered patients</Text>
      </View>

      {/* ── Patient List ────────────────────────────────────────────────────── */}
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patient_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={40} color="#2a2e36" />
            <Text style={styles.emptyTitle}>No Patients Found</Text>
            <Text style={styles.emptyText}>No ICU patients have been registered in this hospital yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = VENTILATOR_STATUS_COLORS[item.ventilator_status] ?? VENTILATOR_STATUS_COLORS.off;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/(app)/patient/[id]', params: { id: item.patient_id } })
              }
              activeOpacity={0.75}
            >
              {/* Ventilator status accent stripe */}
              <View style={[styles.stripe, { backgroundColor: statusStyle.text }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                      {item.ventilator_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  Bed {item.bed_number ?? 'N/A'} · {item.gender} · {item.age} yrs
                </Text>
              </View>

              <ChevronRight size={16} color="#3a3e46" />
            </TouchableOpacity>
          );
        }}
      />

      {/* ── FAB: Add Patient (clinicians only) ──────────────────────────────── */}
      {canEditPatients && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <UserPlus size={20} color="#0b0c10" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0c10' },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#5a5c5e', marginTop: 2, fontWeight: '600' },

  list: { padding: 16, paddingTop: 4, paddingBottom: 100 },

  card: {
    backgroundColor: '#1a2130',
    borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  stripe: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  meta: { fontSize: 12, color: '#5a5c5e' },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#3a3e46' },
  emptyText: { fontSize: 13, color: '#3a3e46', textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#66fcf1',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#66fcf1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
});
