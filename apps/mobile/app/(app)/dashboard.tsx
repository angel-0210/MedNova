import React, { useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, ActivityIndicator, Dimensions 
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { usePatientsQuery, useAlertsQuery } from '@mednova/hooks';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocketService';
import { 
  Activity, Users, ShieldAlert, Wifi, 
  Settings, LogOut, ChevronRight, BarChart2 
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: patients = [], isLoading: loadingPatients } = usePatientsQuery();
  const { data: alerts = [], isLoading: loadingAlerts } = useAlertsQuery();

  // Connect websocket on load
  useEffect(() => {
    websocketService.connect(queryClient);
    return () => {
      websocketService.disconnect();
    };
  }, [queryClient]);

  const activeVentilators = patients.filter(p => p.ventilator_status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.alert_type === 'critical').length;
  const systemStatus = criticalAlerts > 0 ? 'Degraded' : 'Optimal';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Clinician Top Greeting */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.title}>Hello, {user?.name}</Text>
          <Text style={styles.subtitle}>{user?.role.toUpperCase()} • Hospital Group</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={18} color="#d90429" />
        </TouchableOpacity>
      </View>

      {/* Bento Grid Stats */}
      <View style={styles.bentoGrid}>
        <View style={styles.bentoCard}>
          <View style={styles.bentoIconContainer}>
            <Users size={20} color="#66fcf1" />
          </View>
          <Text style={styles.bentoVal}>
            {activeVentilators} <Text style={{ fontSize: 14, color: '#8f9091' }}>/ {patients.length}</Text>
          </Text>
          <Text style={styles.bentoLabel}>Active Ventilators</Text>
        </View>

        <TouchableOpacity 
          style={[styles.bentoCard, { borderLeftColor: '#d90429', borderLeftWidth: 3 }]}
          onPress={() => router.push('/(app)/alerts')}
        >
          <View style={[styles.bentoIconContainer, { backgroundColor: 'rgba(217, 4, 41, 0.1)' }]}>
            <ShieldAlert size={20} color="#d90429" />
          </View>
          <Text style={[styles.bentoVal, { color: '#d90429' }]}>{alerts.length}</Text>
          <Text style={styles.bentoLabel}>Active Alerts</Text>
        </TouchableOpacity>

        <View style={[styles.bentoCard, { borderLeftColor: '#2a9d8f', borderLeftWidth: 3 }]}>
          <View style={[styles.bentoIconContainer, { backgroundColor: 'rgba(42, 157, 143, 0.1)' }]}>
            <Wifi size={20} color="#2a9d8f" />
          </View>
          <Text style={[styles.bentoVal, { color: '#2a9d8f' }]}>{systemStatus}</Text>
          <Text style={styles.bentoLabel}>System Status</Text>
        </View>
      </View>

      {/* Quick Navigation Menu */}
      <Text style={styles.sectionTitle}>Navigation Control</Text>
      <View style={styles.navMenu}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(app)/patients')}>
          <View style={styles.navItemLeft}>
            <Users size={18} color="#66fcf1" />
            <Text style={styles.navItemText}>Patient Registry</Text>
          </View>
          <ChevronRight size={16} color="#8f9091" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(app)/devices')}>
          <View style={styles.navItemLeft}>
            <Wifi size={18} color="#66fcf1" />
            <Text style={styles.navItemText}>IoT Telemetry Gateways</Text>
          </View>
          <ChevronRight size={16} color="#8f9091" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(app)/alerts')}>
          <View style={styles.navItemLeft}>
            <ShieldAlert size={18} color="#66fcf1" />
            <Text style={styles.navItemText}>Alerts Center</Text>
          </View>
          <ChevronRight size={16} color="#8f9091" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(app)/analytics')}>
          <View style={styles.navItemLeft}>
            <BarChart2 size={18} color="#66fcf1" />
            <Text style={styles.navItemText}>Historical Analytics</Text>
          </View>
          <ChevronRight size={16} color="#8f9091" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(app)/settings')}>
          <View style={styles.navItemLeft}>
            <Settings size={18} color="#66fcf1" />
            <Text style={styles.navItemText}>Settings & Profile</Text>
          </View>
          <ChevronRight size={16} color="#8f9091" />
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#8f9091',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(217, 4, 41, 0.1)',
    borderRadius: 12,
  },
  bentoGrid: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 28,
  },
  bentoCard: {
    backgroundColor: '#1f2833',
    borderColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 110,
  },
  bentoIconContainer: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(102, 252, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bentoVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#66fcf1',
  },
  bentoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8f9091',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  navMenu: {
    backgroundColor: '#1f2833',
    borderRadius: 16,
    overflow: 'hidden',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
