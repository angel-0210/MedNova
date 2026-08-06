import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useDeviceStore } from '../stores';
import { VentilatorStatusCard } from '../components/medical/VentilatorStatusCard';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useRoleAccess } from '../hooks/useRoleAccess';

export const DeviceManagement: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { devices, fetchDevices } = useDeviceStore();
  const { canPairDevices } = useRoleAccess();

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          Ventilator Devices
        </Text>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.device_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <VentilatorStatusCard device={item} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>
              No ventilator devices registered in this hospital.
            </Text>
          </View>
        }
      />

      {canPairDevices && (
        <View style={styles.footer}>
          <Button 
            title="Scan & Pair Local BLE Device" 
            onPress={() => navigation.navigate('BLEPairing')}
          />
        </View>
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
