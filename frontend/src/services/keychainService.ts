import * as Keychain from 'react-native-keychain';
import { MMKV } from 'react-native-mmkv';

export const mmkvStorage = new MMKV({
  id: 'mednova-storage',
});

const SERVICE_NAME = 'mednova-auth';

export const keychainService = {
  async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await Keychain.setGenericPassword(
        'tokens',
        JSON.stringify({ accessToken, refreshToken }),
        { service: SERVICE_NAME }
      );
    } catch (error) {
      console.error('Failed to save tokens in Keychain', error);
    }
  },

  async getTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: SERVICE_NAME });
      if (credentials) {
        return JSON.parse(credentials.password);
      }
    } catch (error) {
      console.error('Failed to retrieve tokens from Keychain', error);
    }
    return null;
  },

  async clearTokens() {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE_NAME });
    } catch (error) {
      console.error('Failed to reset tokens in Keychain', error);
    }
  },
};
