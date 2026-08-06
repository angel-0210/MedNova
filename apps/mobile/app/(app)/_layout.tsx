import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

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
    // Guard: Redirect to login
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2833' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0b0c10' },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'ICU Intel Dashboard', headerBackVisible: false }} />
      <Stack.Screen name="patients" options={{ title: 'Patient Registry' }} />
      <Stack.Screen name="devices" options={{ title: 'IoT Gateways' }} />
      <Stack.Screen name="alerts" options={{ title: 'Alerts Console' }} />
      <Stack.Screen name="patient/[id]" options={{ title: 'Patient Telemetry' }} />
      <Stack.Screen name="device/[id]" options={{ title: 'Gateway Settings' }} />
      <Stack.Screen name="analytics" options={{ title: 'Telemetry Analytics' }} />
      <Stack.Screen name="profile" options={{ title: 'Clinical Staff Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'App Settings' }} />
    </Stack>
  );
}
