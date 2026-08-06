import * as SecureStore from 'expo-secure-store';
import { User } from '@mednova/types';

const ACCESS_TOKEN_KEY = 'mednova_access_token';
const REFRESH_TOKEN_KEY = 'mednova_refresh_token';
const USER_PROFILE_KEY = 'mednova_user_profile';

export const secureStoreService = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token from SecureStore', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token from SecureStore', error);
      return null;
    }
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Failed to save tokens to SecureStore', error);
      throw error;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens from SecureStore', error);
    }
  },

  async getUserProfile(): Promise<User | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user profile from SecureStore', error);
      return null;
    }
  },

  async saveUserProfile(profile: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile to SecureStore', error);
      throw error;
    }
  },

  async clearUserProfile(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
    } catch (error) {
      console.error('Failed to clear user profile from SecureStore', error);
    }
  },
};
