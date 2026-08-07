import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the backend base URL dynamically.
 *
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL env var  →  explicit override (production / CI)
 * 2. Expo bundler hostUri         →  Expo Go / dev-client on physical device (LAN IP)
 * 3. Platform default             →  Android emulator 10.0.2.2 | iOS simulator localhost
 */
const resolveBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

/** HTTP base URL — e.g. `http://192.168.1.10:8000` */
export const BASE_API_URL = resolveBaseUrl();

/** WebSocket base URL — e.g. `ws://192.168.1.10:8000` */
export const BASE_WS_URL = BASE_API_URL.replace(/^http/, 'ws');
