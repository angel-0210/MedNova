import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePatientsQuery } from '@mednova/hooks';
import { useRBAC } from '../../../contexts/RBACContext';
import { ChevronRight, Users, UserPlus, Search, RefreshCw, XCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../../constants/theme';
import { Patient } from '@mednova/types';

const VENTILATOR_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:  { bg: theme.colors.statusStable, text: '#ffffff' },
  weaning: { bg: theme.colors.surfaceContainer,  text: theme.colors.primary },
  off:     { bg: theme.colors.surfaceContainerHighest,    text: theme.colors.outline },
};

const FILTER_TABS = [
  { key: 'all', label: 'All Beds' },
  { key: 'active', label: 'Active support' },
  { key: 'weaning', label: 'Weaning Phase' },
  { key: 'off', label: 'Off Support' }
];

export default function PatientsScreen() {
  const { canEditPatients } = useRBAC();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [limit, setLimit] = useState(20);

  // Debouncing search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetching patients query
  const queryParams = {
    search: debouncedSearch.trim() || undefined,
    ventilator_status: statusFilter === 'all' ? undefined : (statusFilter as any),
    skip: 0,
    limit: limit
  };

  const { data: patients = [], isLoading, isError, refetch } = usePatientsQuery(queryParams);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (patients.length >= limit) {
      setLimit(prev => prev + 20);
    }
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerPad}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerPad}>
          <XCircle size={40} color={theme.colors.error} />
          <Text style={[theme.typography.bodyMd, { color: theme.colors.error, fontWeight: '700', marginTop: 8 }]}>Connection Error</Text>
          <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>Failed to fetch patient registries.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={[theme.typography.labelCaps, { color: '#ffffff' }]}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Users size={40} color={theme.colors.outline} />
        <Text style={[theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '800' }]}>No Patients Found</Text>
        <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 }]}>
          No ICU patients match the selected search filters or status.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={[theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>Patient Registry</Text>
        <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>{patients.length} matching patients</Text>
      </View>

      {/* Search Input Container */}
      <View style={styles.searchBox}>
        <Search size={18} color={theme.colors.outline} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, bed, ward, status..."
          placeholderTextColor={theme.colors.outline}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={[theme.typography.labelCaps, { color: theme.colors.outline, fontSize: 10 }]}>CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, theme.typography.labelCaps, { color: isActive ? '#ffffff' : theme.colors.primary }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Patient List */}
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patient_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState()}
        renderItem={({ item }) => {
          const statusStyle = VENTILATOR_STATUS_COLORS[item.ventilator_status] ?? VENTILATOR_STATUS_COLORS.off;
          const statusLineColor = item.ventilator_status === 'active' ? theme.colors.statusStable : (item.ventilator_status === 'weaning' ? theme.colors.statusCritical : theme.colors.outline);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}
              onPress={() =>
                router.push({ pathname: '/(app)/patient/[id]', params: { id: item.patient_id } })
              }
              activeOpacity={0.75}
            >
              <View style={[styles.stripe, { backgroundColor: statusLineColor }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.name, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '700' }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, theme.typography.labelCaps, { color: statusStyle.text, fontSize: 8 }]}>
                      {item.ventilator_status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.meta, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
                  Bed {item.bed_number ?? 'N/A'} · {item.gender} · {item.age} yrs
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.outline} style={styles.cardArrow} />
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB: Add Patient (clinicians only) */}
      {canEditPatients && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} activeOpacity={0.85}>
          <UserPlus size={20} color={theme.colors.onPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', height: 44,
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    marginHorizontal: 20, paddingHorizontal: 12, marginBottom: 12
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', color: theme.colors.primary, fontSize: 14 },
  tabContainer: { height: 38, marginBottom: 12 },
  tabScroll: { paddingHorizontal: 20, gap: 8 },
  tab: {
    paddingHorizontal: 12, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: theme.colors.outlineVariant
  },
  activeTab: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabLabel: { fontSize: 10 },
  list: { padding: 20, paddingTop: 4, paddingBottom: 100 },
  card: {
    borderRadius: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1
  },
  stripe: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { flex: 1 },
  badge: { borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 8, fontWeight: '800' },
  meta: { fontSize: 12 },
  cardArrow: { marginRight: 16 },
  centerPad: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  retryBtn: {
    backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, marginTop: 12
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  }
});
