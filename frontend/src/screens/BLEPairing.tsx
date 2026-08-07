import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { bleService } from '../services/bleService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeProvider';
import { Device as BleDevice } from 'react-native-ble-plx';

export const BLEPairing: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BleDevice[]>([]);

  useEffect(() => {
    return () => {
      bleService.stopScan();
    };
  }, []);

  const handleStartScan = () => {
    setDevices([]);
    setScanning(true);
    
    // Scan for 10 seconds
    bleService.startScan((device) => {
      if (device.name) {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    });

    setTimeout(() => {
      bleService.stopScan();
      setScanning(false);
    }, 10000);
  };

  const handleConnect = async (device: BleDevice) => {
    try {
      bleService.stopScan();
      setScanning(false);
      
      Alert.alert('Connecting', `Establishing secure link with ${device.name}...`);
      await bleService.connectToDevice(device);
      
      Alert.alert('Success', 'Local ventilator device paired successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Connection Failed', 'Could not establish connection to the BLE peripheral.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          Pair Local Ventilator Node
        </Text>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
          Turn on your ESP32 device and ensure Bluetooth is enabled on this tablet/phone.
        </Text>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => handleConnect(item)}>
            <Card variant="neumorphic" style={styles.deviceItem}>
              <View>
                <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
                  {item.name || 'Unknown Device'}
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  MAC: {item.id}
                </Text>
              </View>
              <Text style={[typography.labelCaps, { color: colors.primary }]}>PAIR</Text>
            </Card>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          scanning ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>Scanning for BLE signals...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !scanning ? (
            <View style={styles.emptyContainer}>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                No local ventilator nodes found. Tap scan to search.
              </Text>
            </View>
          ) : null
        }
      />

      <View style={styles.footer}>
        <Button 
          title={scanning ? "Scanning..." : "Start Scanning"} 
          disabled={scanning}
          onPress={handleStartScan}
        />
      </View>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
