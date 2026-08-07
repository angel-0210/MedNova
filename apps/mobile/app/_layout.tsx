import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { RBACProvider } from '../contexts/RBACContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { notificationService } from '../services/notificationService';
import { apiClient } from '@mednova/api';
import { BASE_API_URL } from '../config/apiConfig';

// Prevent splash screen from auto-hiding until session restore finishes
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Configure Axios base URL using the shared dynamic resolver
apiClient.defaults.baseURL = BASE_API_URL;
console.log('[Mobile] API Base URL:', BASE_API_URL);

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(console.warn);

    notificationService.registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('[Mobile] Push token registered:', token);
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {/*
          AuthProvider must be the outer wrapper.
          RBACProvider sits inside it because it reads user from useAuth().
        */}
        <AuthProvider>
          <RBACProvider>
            <StatusBar style="light" />
            <Slot />
          </RBACProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
