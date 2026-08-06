import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { notificationService } from '../services/notificationService';
import { apiClient } from '@mednova/api';

// Prevent splash screen from auto-hiding until session restore finishes
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

// Sync backend API URL
const baseApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
apiClient.defaults.baseURL = baseApiUrl;

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen on load
    SplashScreen.hideAsync().catch(console.warn);

    // Register push notifications
    notificationService.registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('Mobile registered push token:', token);
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <Slot />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
