import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { usePatientStore, useAIStore } from '../stores';
import { PatientCard } from '../components/medical/PatientCard';
import { useTheme } from '../theme/ThemeProvider';

export const PatientList: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { patients, fetchPatients, selectPatient } = usePatientStore();
  const { predictions, fetchLatestPrediction } = useAIStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Fetch AI predictions for all patients when patient list changes
  useEffect(() => {
    patients.forEach((patient) => {
      if (!predictions[patient.patient_id]) {
        fetchLatestPrediction(patient.patient_id);
      }
    });
  }, [patients, predictions, fetchLatestPrediction]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.bed_number && p.bed_number.includes(search))
  );

  const handleSelectPatient = async (patientId: string) => {
    await selectPatient(patientId);
    navigation.navigate('PatientDetails', { patientId });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          Patient Registry
        </Text>
        <TextInput
          placeholder="Search by name or bed number..."
          placeholderTextColor={colors.onSurfaceVariant + '80'}
          style={[
            styles.searchBar,
            typography.bodyMd,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant + '33',
              color: colors.onSurface,
            },
          ]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.patient_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            riskScore={predictions[item.patient_id]?.risk_score ?? 15}
            onPress={() => handleSelectPatient(item.patient_id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              No patients found matching "{search}"
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  searchBar: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
