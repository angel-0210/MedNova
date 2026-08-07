import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { keychainService } from '../services/keychainService';

// Target the local FastAPI backend dynamically (supporting both simulators and physical devices)
const getBaseApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

const BASE_URL = getBaseApiUrl();
console.log('[Frontend] Configured API Base URL:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const tokens = await keychainService.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = await keychainService.getTokens();
        if (tokens?.refreshToken) {
          // Perform JWT token refresh call
          const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: tokens.refreshToken,
          });
          const { access_token, refresh_token } = response.data;
          await keychainService.saveTokens(access_token, refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Session expired, logging out...', refreshError);
        await keychainService.clearTokens();
        // Here we could trigger a logout hook or redirect
      }
    }
    return Promise.reject(error);
  }
);
