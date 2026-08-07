import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

/**
 * Auth-guarded layout for the entire authenticated section.
 *
 * Structure:
 *   (app)/_layout.tsx  →  Stack (auth guard)
 *     ├── (tabs)        →  Bottom tab navigator (all main screens)
 *     ├── patient/[id]  →  Patient detail (pushed over tab bar, no tab visible)
 *     ├── device/[id]   →  Device detail  (pushed over tab bar, no tab visible)
 *     └── analytics     →  Analytics      (pushed over tab bar, no tab visible)
 */
export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0c10' }}>
        <ActivityIndicator size="large" color="#66fcf1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2833' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0b0c10' },
      }}
    >
      {/* The tab group renders without a header — the tab bar provides navigation */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Detail screens pushed over the tab bar — show a back-button header */}
      <Stack.Screen name="patient/[id]" options={{ title: 'Patient Telemetry' }} />
      <Stack.Screen name="device/[id]"  options={{ title: 'Gateway Details' }} />
      <Stack.Screen name="analytics"    options={{ title: 'Clinical Analytics' }} />
    </Stack>
  );
}
