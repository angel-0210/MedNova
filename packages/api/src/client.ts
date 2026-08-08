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

// A 401 from the auth endpoints themselves must never start a refresh. /auth/logout
// 401ing would otherwise refresh -> fail -> onSessionExpired -> logout() -> POST
// /auth/logout again, looping forever and re-navigating the app on every pass.
const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'];
const isAuthPath = (url?: string) => !!url && AUTH_PATHS.some((p) => url.includes(p));

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
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath(originalRequest.url)) {
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
        const refreshToken = tokenStorage ? await tokenStorage.getRefreshToken() : null;
        if (!refreshToken) {
          // Nothing to refresh with. Falling through here left the app 401ing forever
          // without ever expiring the session, so treat it as an expired session.
          throw error;
        }

        const baseURL = originalRequest.baseURL || apiClient.defaults.baseURL || '';
        const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = response.data;
        await tokenStorage!.saveTokens(access_token, refresh_token);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        processQueue(null, access_token);
        return apiClient(originalRequest);
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
