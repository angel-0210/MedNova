import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores';
import { useTheme } from '../theme/ThemeProvider';
import { Bell, Search, Activity as ActiveIcon } from 'lucide-react-native';

export const Settings: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography, mode, setMode } = useTheme();
  const { logout, user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const settingsContent = (
    <View style={styles.flex1}>
      {/* Top App Bar Header */}
      <View style={[styles.appBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.outlineVariant + '33' }]}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={[styles.avatar, { borderColor: colors.outlineVariant }]}
          />
          <Text style={[typography.labelCaps, { color: colors.onSurface, fontWeight: 'bold' }]}>
            Dr. Sarah Mitchell
          </Text>
        </View>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          ICU Intel
        </Text>
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, isDesktop ? styles.desktopPadding : null]}>
        
        <View style={styles.screenHeader}>
          <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700' }]}>
            System Settings
          </Text>
        </View>

        {/* User Card */}
        <Card variant="neumorphic" style={styles.profileCard}>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
            {user?.name || 'Dr. Sarah Mitchell'}
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

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Desktop sidebar */}
        <View style={[styles.desktopSidebar, { backgroundColor: colors.surface, borderRightColor: colors.outlineVariant + '33' }]}>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Patients')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Bell size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkActive, { backgroundColor: colors.secondaryContainer + '33', marginTop: 'auto', marginBottom: 0 }]} 
            activeOpacity={0.8}
          >
            <View style={[styles.activeIndicatorBar, { backgroundColor: colors.primary }]} />
            <Search size={20} color={colors.primary} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>{settingsContent}</View>
      </View>
    );
  }

  return settingsContent;
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopSidebar: {
    width: 96,
    height: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    borderRightWidth: 1,
  },
  sidebarLink: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sidebarLinkActive: {
    position: 'relative',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarLinkBottom: {
    marginTop: 'auto',
    marginBottom: 0,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  appBarIconButton: {
    padding: 6,
  },
  content: {
    padding: 16,
  },
  desktopPadding: {
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  screenHeader: {
    marginBottom: 20,
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

