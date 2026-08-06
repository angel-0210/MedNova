import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores';
import { useTheme } from '../theme/ThemeProvider';

export const Settings: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography, mode, setMode } = useTheme();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          System Settings
        </Text>
      </View>

      <View style={styles.content}>
        {/* User Card */}
        <Card variant="neumorphic" style={styles.profileCard}>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
            {user?.name || 'Dr. Mitchell'}
          </Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            {user?.email || 'mitchell@hospital.org'} • Role: {user?.role.toUpperCase() || 'DOCTOR'}
          </Text>
        </Card>

        {/* Theme Settings */}
        <View style={styles.section}>
          <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, marginBottom: 12 }]}>
            Theme & Appearance
          </Text>
          
          <View style={styles.themeOptions}>
            <TouchableOpacity 
              style={[
                styles.themeBtn, 
                { 
                  backgroundColor: mode === 'light' ? colors.primary : colors.surfaceContainer,
                  borderColor: colors.outlineVariant 
                }
              ]}
              onPress={() => setMode('light')}
            >
              <Text style={[typography.labelCaps, { color: mode === 'light' ? '#ffffff' : colors.onSurface }]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeBtn, 
                { 
                  backgroundColor: mode === 'dark' ? colors.primary : colors.surfaceContainer,
                  borderColor: colors.outlineVariant 
                }
              ]}
              onPress={() => setMode('dark')}
            >
              <Text style={[typography.labelCaps, { color: mode === 'dark' ? '#ffffff' : colors.onSurface }]}>Dark</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeBtn, 
                { 
                  backgroundColor: mode === 'hospital' ? colors.primary : colors.surfaceContainer,
                  borderColor: colors.outlineVariant 
                }
              ]}
              onPress={() => setMode('hospital')}
            >
              <Text style={[typography.labelCaps, { color: mode === 'hospital' ? '#ffffff' : colors.onSurface }]}>Hospital</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <Button 
          title="Sign Out Session" 
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 16,
  },
});
