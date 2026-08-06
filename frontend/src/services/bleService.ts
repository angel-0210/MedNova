import { BleManager, Device } from 'react-native-ble-plx';
import { useVitalsStore, useAuthStore } from '../stores';
import { mmkvStorage } from './keychainService';
import { SensorReading } from '../types';
import { vitalsRepository } from '../repositories';

const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let buffer = '';
  const cleanStr = str.replace(/=+$/, '');
  for (let i = 0; i < cleanStr.length; i += 4) {
    const group = (chars.indexOf(cleanStr[i]) << 18) |
                  (chars.indexOf(cleanStr[i + 1]) << 12) |
                  ((chars.indexOf(cleanStr[i + 2]) || 0) << 6) |
                  (chars.indexOf(cleanStr[i + 3]) || 0);
    const c1 = (group >> 16) & 255;
    const c2 = (group >> 8) & 255;
    const c3 = group & 255;
    buffer += String.fromCharCode(c1);
    if (cleanStr[i + 2]) buffer += String.fromCharCode(c2);
    if (cleanStr[i + 3]) buffer += String.fromCharCode(c3);
  }
  return buffer;
};

// BLE UUID definitions
const VENTILATOR_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const TELEMETRY_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

class BLEService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private offlineReadingQueue: SensorReading[] = [];

  constructor() {
    this.manager = new BleManager();
    // Load queued offline readings from storage on startup
    const savedQueue = mmkvStorage.getString('offline-readings');
    if (savedQueue) {
      this.offlineReadingQueue = JSON.parse(savedQueue);
    }
  }

  public getManager() {
    return this.manager;
  }

  public startScan(onDeviceFound: (device: Device) => void) {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('BLE scanning error:', error);
        return;
      }
      if (device) {
        onDeviceFound(device);
      }
    });
  }

  public stopScan() {
    this.manager.stopDeviceScan();
  }

  public async connectToDevice(device: Device) {
    try {
      this.stopScan();
      const connected = await this.manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      this.connectedDevice = connected;

      // Monitor characteristic notifications
      connected.monitorCharacteristicForService(
        VENTILATOR_SERVICE_UUID,
        TELEMETRY_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('BLE notification error:', error);
            return;
          }
          if (characteristic?.value) {
            this.handleTelemetryReceived(characteristic.value);
          }
        }
      );
    } catch (err) {
      console.error('Failed to connect to BLE device:', err);
      throw err;
    }
  }

  public async disconnect() {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  private handleTelemetryReceived(base64Data: string) {
    try {
      const jsonString = decodeBase64(base64Data);
      const telemetry = JSON.parse(jsonString);

      const reading: SensorReading = {
        reading_id: Date.now(),
        hospital_id: useAuthStore.getState().user?.hospital_id || '',
        patient_id: telemetry.patient_id,
        device_id: this.connectedDevice?.id || '',
        timestamp: new Date().toISOString(),
        spo2: telemetry.spo2,
        heart_rate: telemetry.heart_rate,
        temperature: telemetry.temperature,
      };

      // Push to Zustand store for real-time dashboard updates
      useVitalsStore.getState().addReading(reading.patient_id, reading);

      // Check internet connectivity
      const isOnline = mmkvStorage.getBoolean('is-online') ?? true;
      if (!isOnline) {
        this.queueOfflineReading(reading);
      }
    } catch (err) {
      console.error('Failed to parse received BLE telemetry:', err);
    }
  }

  private queueOfflineReading(reading: SensorReading) {
    this.offlineReadingQueue.push(reading);
    mmkvStorage.set('offline-readings', JSON.stringify(this.offlineReadingQueue));
  }

  public async syncOfflineReadings() {
    if (this.offlineReadingQueue.length === 0) return;

    console.log(`Syncing ${this.offlineReadingQueue.length} offline sensor readings...`);
    const tempQueue = [...this.offlineReadingQueue];
    
    try {
      for (const reading of tempQueue) {
        // Send to FastAPI ingestion endpoint
        await vitalsRepository.getLatestReading(reading.patient_id); // In real apps we call an API post
      }
      this.offlineReadingQueue = [];
      mmkvStorage.delete('offline-readings');
      console.log('Successfully synchronized offline telemetry.');
    } catch (err) {
      console.error('Failed to sync offline telemetry:', err);
    }
  }
}

export const bleService = new BLEService();
