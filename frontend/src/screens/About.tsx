import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { Bell, Search, Activity as ActiveIcon } from 'lucide-react-native';

export const About: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const aboutContent = (
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
            About MedNova
          </Text>
        </View>
        
        <Card variant="neumorphic" style={styles.card}>
          <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>MedNova Platform</Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
            Version 1.0.0 (Production Build)
          </Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 12 }]}>
            Certified Medical Device Integration Layer. Engineered for safe, reliable bedside ventilator monitoring.
          </Text>
        </Card>
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
            style={[styles.sidebarLink, styles.sidebarLinkBottom]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Search size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>{aboutContent}</View>
      </View>
    );
  }

  return aboutContent;
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
    padding: 24,
  },
  desktopPadding: {
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  screenHeader: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
  },
});

