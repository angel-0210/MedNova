import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { usePatientStore, useAIStore, useVitalsStore } from '../stores';
import { PatientCard } from '../components/medical/PatientCard';
import { useTheme } from '../theme/ThemeProvider';
import { Search, Bell, Activity as ActiveIcon } from 'lucide-react-native';
import { Input } from '../components/common/Input';

export const PatientList: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { patients, fetchPatients, selectPatient } = usePatientStore();
  const { predictions, fetchLatestPrediction } = useAIStore();
  const { latestVitals } = useVitalsStore();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'stable'>('all');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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

  const handleSelectPatient = async (patientId: string) => {
    await selectPatient(patientId);
    navigation.navigate('PatientDetails', { patientId });
  };

  // 1. Filter by search query
  let filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.bed_number && p.bed_number.includes(search))
  );

  // 2. Filter by risk segments
  if (activeTab === 'critical') {
    filtered = filtered.filter(p => (predictions[p.patient_id]?.risk_score ?? 0) >= 75);
  } else if (activeTab === 'stable') {
    filtered = filtered.filter(p => (predictions[p.patient_id]?.risk_score ?? 0) < 50);
  }

  const patientListContent = (
    <View style={styles.flex1}>
      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.outlineVariant + '33' }]}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={[styles.avatar, { borderColor: colors.outlineVariant }]}
          />
          <Text style={[typography.labelCaps, { color: colors.onSurface, fontWeight: 'bold' }]}>
            Dr. Sarah Mitchell
          </Text>
        </View>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          ICU Intel
        </Text>
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.headerSection, isDesktop ? styles.desktopPaddingHeader : null]}>
        <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700', marginBottom: 16 }]}>
          Patient Registry
        </Text>

        {/* Search Field Inset */}
        <Input
          placeholder="Search name or bed number..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.outline} />}
        />

        {/* Segment Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              activeTab === 'all' ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceContainerHighest },
            ]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'all' ? { color: '#FFFFFF' } : { color: colors.primary }]}>
              All Patients ({patients.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillBtn,
              activeTab === 'critical' ? { backgroundColor: colors.statusCritical } : { backgroundColor: colors.surfaceContainerHighest },
            ]}
            onPress={() => setActiveTab('critical')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'critical' ? { color: '#FFFFFF' } : { color: colors.statusCritical }]}>
              Critical ({patients.filter(p => (predictions[p.patient_id]?.risk_score ?? 0) >= 75).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillBtn,
              activeTab === 'stable' ? { backgroundColor: colors.statusStable } : { backgroundColor: colors.surfaceContainerHighest },
            ]}
            onPress={() => setActiveTab('stable')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillBtnText, activeTab === 'stable' ? { color: '#FFFFFF' } : { color: colors.statusStable }]}>
              Stable ({patients.filter(p => (predictions[p.patient_id]?.risk_score ?? 0) < 50).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.patient_id}
        contentContainerStyle={[styles.listContent, isDesktop ? styles.desktopPaddingList : null]}
        renderItem={({ item }) => (
          <PatientCard
            patient={item}
            riskScore={predictions[item.patient_id]?.risk_score ?? 15}
            spo2={latestVitals[item.patient_id]?.spo2 ?? 96}
            heartRate={latestVitals[item.patient_id]?.heart_rate ?? 75}
            onPress={() => handleSelectPatient(item.patient_id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              No patients found matching the selected segment filters.
            </Text>
          </View>
        }
      />
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Desktop sidebar */}
        <View style={[styles.desktopSidebar, { backgroundColor: colors.surface, borderRightColor: colors.outlineVariant + '33' }]}>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkActive, { backgroundColor: colors.secondaryContainer + '33' }]}
            activeOpacity={0.8}
          >
            <View style={[styles.activeIndicatorBar, { backgroundColor: colors.primary }]} />
            <ActiveIcon size={20} color={colors.primary} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
              Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Bell size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkBottom]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Search size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>{patientListContent}</View>
      </View>
    );
  }

  return patientListContent;
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopSidebar: {
    width: 96,
    height: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    borderRightWidth: 1,
  },
  sidebarLink: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sidebarLinkActive: {
    position: 'relative',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarLinkBottom: {
    marginTop: 'auto',
    marginBottom: 0,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  appBarIconButton: {
    padding: 6,
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  desktopPaddingHeader: {
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  desktopPaddingList: {
    paddingHorizontal: 40,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

