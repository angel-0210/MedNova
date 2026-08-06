import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@mednova/types';
import { secureStoreService } from '../services/secureStoreService';
import { authRepository, setTokenStorage } from '@mednova/api';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, passwordHash: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sync Axios client with secureStore
    setTokenStorage({
      getAccessToken: secureStoreService.getAccessToken,
      getRefreshToken: secureStoreService.getRefreshToken,
      saveTokens: secureStoreService.saveTokens,
      clearTokens: secureStoreService.clearTokens,
    });

    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const accessToken = await secureStoreService.getAccessToken();
      const profile = await secureStoreService.getUserProfile();
      if (accessToken && profile) {
        setUser(profile);
      }
    } catch (e) {
      console.warn('Session restore failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, passwordHash: string) => {
    setIsLoading(true);
    try {
      const res = await authRepository.login(email, passwordHash);
      await secureStoreService.saveTokens(res.access_token, res.refresh_token);
      await secureStoreService.saveUserProfile(res.user);
      setUser(res.user);
      router.replace('/(app)/dashboard');
    } catch (error) {
      console.error('Login error', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await secureStoreService.clearTokens();
    await secureStoreService.clearUserProfile();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
