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

  return 'https://mednova-9l87.onrender.com';
};

/** HTTP base URL — e.g. `http://192.168.1.10:8000` */
export const BASE_API_URL = resolveBaseUrl();

/** WebSocket base URL — e.g. `ws://192.168.1.10:8000` */
export const BASE_WS_URL = BASE_API_URL.replace(/^http/, 'ws');
