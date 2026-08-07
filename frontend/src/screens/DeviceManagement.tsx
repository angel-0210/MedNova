import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Wind, Syringe, Monitor, Search, Plus } from 'lucide-react-native';
import { useDeviceStore } from '../stores';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { Device } from '../types';

const { width } = Dimensions.get('window');

export const DeviceManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { devices, fetchDevices } = useDeviceStore();
  const { canPairDevices } = useRoleAccess();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Maps device properties to high-fidelity mockup device profiles
  const getDeviceMetadata = (device: Device, index: number) => {
    const isVentilator = device.mac_address.toLowerCase().includes('vt') || index % 3 === 0;
    const isSyringePump = device.mac_address.toLowerCase().includes('sp') || index % 3 === 1;

    if (isVentilator) {
      return {
        name: 'Ventilator V-800',
        id: `VT-${device.connection_code || '2938'}`,
        status: 'Maintenance Due',
        statusBg: '#FFA515',
        statusTextColor: '#FFFFFF',
        icon: <Wind size={22} color="#1E293B" />,
        battery: '32%',
        connection: 'Stable',
        connectionColor: colors.primary,
        progress: 0.8,
        progressColor: '#FFA515',
        calibText: 'Last calibrated: 180 days ago',
        calibTextColor: '#FFA515',
        actions: (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleServiceBtn}>
              <Text style={styles.scheduleServiceBtnText}>Schedule Service</Text>
            </TouchableOpacity>
          </View>
        )
      };
    } else if (isSyringePump) {
      return {
        name: 'Syringe Pump SP-2',
        id: `SP-${device.connection_code || '1024'}`,
        status: 'Online',
        statusBg: colors.primary,
        statusTextColor: '#FFFFFF',
        icon: <Syringe size={22} color="#1E293B" />,
        battery: '98% (AC Power)',
        connection: 'Paired',
        connectionColor: colors.primary,
        progress: 0.15,
        progressColor: colors.primary,
        calibText: 'Last calibrated: 12 days ago',
        calibTextColor: '#64748B',
        actions: (
          <View style={[styles.actionsContainer, { justifyContent: 'flex-end' }]}>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
          </View>
        )
      };
    } else {
      return {
        name: 'Patient Monitor PM-X',
        id: `PM-${device.connection_code || '4491'}`,
        status: 'Low Signal',
        statusBg: '#E2E8F0',
        statusTextColor: '#475569',
        icon: <Monitor size={22} color="#1E293B" />,
        battery: '65%',
        connection: 'Weak Wi-Fi',
        connectionColor: '#FFA515',
        progress: 0.45,
        progressColor: colors.primary,
        calibText: 'Last calibrated: 45 days ago',
        calibTextColor: '#64748B',
        actions: (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.diagnoseBtn}>
              <Text style={styles.diagnoseBtnText}>Diagnose</Text>
            </TouchableOpacity>
          </View>
        )
      };
    }
  };

  const renderDeviceCard = ({ item, index }: { item: Device; index: number }) => {
    const meta = getDeviceMetadata(item, index);

    return (
      <Card variant="neumorphic" style={styles.deviceCard}>
        <View style={styles.cardContent}>
          {/* Top Row: Icon, Name, and Status */}
          <View style={styles.topRow}>
            <View style={styles.deviceTitleGroup}>
              {/* Square icon container */}
              <View style={styles.iconContainer}>
                {meta.icon}
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={[styles.deviceName, { color: colors.primary }]}>{meta.name}</Text>
                <Text style={styles.deviceId}>ID: {meta.id}</Text>
              </View>
            </View>

            {/* Status badge */}
            <View style={[styles.statusChip, { backgroundColor: meta.statusBg }]}>
              <Text style={[styles.statusChipText, { color: meta.statusTextColor }]}>
                {meta.status}
              </Text>
            </View>
          </View>

          {/* Grid Parameters: Battery and Connection */}
          <View style={styles.paramGrid}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Battery</Text>
              <Text style={[styles.paramValue, { color: colors.primary }]}>{meta.battery}</Text>
            </View>

            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Connection</Text>
              <Text style={[styles.paramValue, { color: meta.connectionColor }]}>{meta.connection}</Text>
            </View>
          </View>

          {/* Calibration Progress Bar */}
          <View style={styles.calibrationSection}>
            <Text style={styles.calibrationLabel}>Calibration</Text>
            <View style={styles.progressBarTrack}>
              <View style={[
                styles.progressBarFill, 
                { width: `${meta.progress * 100}%`, backgroundColor: meta.progressColor }
              ]} />
            </View>
            <Text style={[styles.lastCalibratedText, { color: meta.calibTextColor }]}>
              {meta.calibText}
            </Text>
          </View>

          {/* Action Buttons Row */}
          {meta.actions}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
      {/* Top App Bar Header */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={styles.avatar}
          />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>ICU Intel</Text>
        </View>
        
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Screen Header & Action */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitleText, { color: colors.primary }]}>Device Management</Text>
        <Text style={styles.screenSubtitleText}>Monitor and manage connected ICU equipment.</Text>

        {canPairDevices && (
          <TouchableOpacity 
            style={[styles.registerBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('BLEPairing')}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.registerBtnText}>Register New Device</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Devices List */}
      <FlatList
        data={devices.length > 0 ? devices : [
          { device_id: '1', mac_address: 'VT-2938', connection_code: '2938', battery_level: 32, status: 'maintenance' },
          { device_id: '2', mac_address: 'SP-1024', connection_code: '1024', battery_level: 98, status: 'online' },
          { device_id: '3', mac_address: 'PM-4491', connection_code: '4491', battery_level: 65, status: 'offline' }
        ] as any}
        keyExtractor={(item) => item.device_id}
        contentContainerStyle={styles.listContent}
        renderItem={renderDeviceCard}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: '#94A3B8', fontWeight: '500' }]}>
              No ventilator devices registered in this hospital.
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
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  appBarIconButton: {
    padding: 6,
  },
  // Screen Titles
  screenHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitleText: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  screenSubtitleText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  registerBtn: {
    flexDirection: 'row',
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 10, 36, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  // Device Cards
  deviceCard: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: 'rgba(0, 10, 36, 0.05)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  deviceId: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Parameter Grid
  paramGrid: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 14,
  },
  paramItem: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  paramValue: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 4,
  },
  // Calibration section
  calibrationSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 16,
  },
  calibrationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastCalibratedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Buttons actions row
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsBtnText: {
    color: '#475569',
    fontSize: 13.5,
    fontWeight: '700',
  },
  scheduleServiceBtn: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  scheduleServiceBtnText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '700',
  },
  diagnoseBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  diagnoseBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
