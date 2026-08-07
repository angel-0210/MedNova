import axios from 'axios';
import { API_TIMEOUT } from '@mednova/constants';

export interface TokenStorage {
  getAccessToken(): Promise<string | null> | string | null;
  getRefreshToken(): Promise<string | null> | string | null;
  saveTokens(accessToken: string, refreshToken: string): Promise<void> | void;
  clearTokens(): Promise<void> | void;
}

let tokenStorage: TokenStorage | null = null;
let onSessionExpired: (() => void) | null = null;

export const setTokenStorage = (storage: TokenStorage) => {
  tokenStorage = storage;
};

export const setOnSessionExpired = (callback: () => void) => {
  onSessionExpired = callback;
};

export const apiClient = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (tokenStorage) {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (tokenStorage) {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (refreshToken) {
            const baseURL = originalRequest.baseURL || apiClient.defaults.baseURL || '';
            const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const { access_token, refresh_token } = response.data;
            await tokenStorage.saveTokens(access_token, refresh_token);
            
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            processQueue(null, access_token);
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (tokenStorage) {
          await tokenStorage.clearTokens();
        }
        if (onSessionExpired) {
          onSessionExpired();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
