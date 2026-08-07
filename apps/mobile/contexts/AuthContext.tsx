import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@mednova/types';
import { secureStoreService } from '../services/secureStoreService';
import { authRepository, setTokenStorage, setOnSessionExpired } from '@mednova/api';
import { router } from 'expo-router';
import { apiClient } from '@mednova/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    // Sync Axios client with SecureStore token service
    setTokenStorage({
      getAccessToken: secureStoreService.getAccessToken,
      getRefreshToken: secureStoreService.getRefreshToken,
      saveTokens: secureStoreService.saveTokens,
      clearTokens: secureStoreService.clearTokens,
    });

    // When the Axios interceptor fails to refresh, trigger logout
    setOnSessionExpired(() => {
      logoutRef.current?.();
    });

    restoreSession();
  }, []);

  // Keep the ref updated so the session-expired callback always has the latest closure
  useEffect(() => {
    logoutRef.current = logout;
  });

  const restoreSession = async () => {
    try {
      const accessToken = await secureStoreService.getAccessToken();
      const profile = await secureStoreService.getUserProfile();
      if (accessToken && profile) {
        setUser(profile);
      }
    } catch (e) {
      console.warn('[AuthContext] Session restore failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authRepository.login(email, password);
      await secureStoreService.saveTokens(res.access_token, res.refresh_token);
      await secureStoreService.saveUserProfile(res.user);
      setUser(res.user);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (error) {
      console.error('[AuthContext] Login error', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Revoke the session on the backend (invalidates the Supabase refresh token)
      await apiClient.post('/api/v1/auth/logout').catch((e) => {
        // Non-fatal: still clear tokens locally even if the API call fails
        console.warn('[AuthContext] Backend logout call failed', e);
      });
    } finally {
      await secureStoreService.clearTokens();
      await secureStoreService.clearUserProfile();
      setUser(null);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
