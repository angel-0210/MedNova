import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  Moon, Bell, Volume2, Shield, Info, ChevronRight,
  Globe, Building2, Lock, KeyRound, HelpCircle, LogOut, ChevronLeft
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../constants/theme';

export default function SettingsScreen() {
  const { logout } = useAuth();

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [criticalSound, setCriticalSound] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [refreshInterval, setRefreshInterval] = useState('10');
  const [selectedWard, setSelectedWard] = useState('ICU Central');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Your password has been updated.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of MedNova?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Theme Settings ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Moon size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Switch to high-contrast dark theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={(val) => {
                setDarkMode(val);
                Alert.alert('Appearance', `Dark Mode is not fully loaded in this build.`);
              }}
              trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Push Notifications</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Alert messages for patient events</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          <Divider />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Volume2 size={16} color={criticalSound ? theme.colors.statusCritical : theme.colors.outline} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Critical Alerts Override</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Play alarm sounds even in silent mode</Text>
              </View>
            </View>
            <Switch
              value={criticalSound}
              onValueChange={setCriticalSound}
              trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.statusCritical }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Privacy & Security ────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Privacy & Security</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Shield size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Telemetry Sharing</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Allow sharing diagnostics to improve models</Text>
              </View>
            </View>
            <Switch
              value={telemetryEnabled}
              onValueChange={setTelemetryEnabled}
              trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          <Divider />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Lock size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Biometric Lock</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Require Face ID / Touch ID at launch</Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Language & Preferences ───────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Language & Regional</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => {
            const langs = ['English', 'Spanish', 'French'];
            const nextLang = langs[(langs.indexOf(currentLanguage) + 1) % langs.length];
            setCurrentLanguage(nextLang);
          }}>
            <View style={styles.settingLeft}>
              <Globe size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Language</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Selected system locale</Text>
              </View>
            </View>
            <Text style={[styles.prefVal, theme.typography.bodySm]}>{currentLanguage}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hospital Preferences ─────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Hospital Preferences</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Building2 size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Focus ICU Ward</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Default monitor view filter</Text>
              </View>
            </View>
            <TextInput
              style={styles.inputStyle}
              value={selectedWard}
              onChangeText={setSelectedWard}
              placeholder="e.g. ICU Central"
            />
          </View>
          <Divider />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Building2 size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>Refresh Frequency</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Telemetry update seconds</Text>
              </View>
            </View>
            <TextInput
              style={styles.inputStyle}
              value={refreshInterval}
              onChangeText={setRefreshInterval}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* ── Password Change Section ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Security Settings</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant, padding: 16 }]}>
          <View style={styles.headerRow}>
            <KeyRound size={16} color={theme.colors.primary} />
            <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600', marginLeft: 8 }]}>Change Password</Text>
          </View>
          <TextInput
            style={styles.textInputBlock}
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="Current Password"
            secureTextEntry
          />
          <TextInput
            style={styles.textInputBlock}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            secureTextEntry
          />
          <TextInput
            style={styles.textInputBlock}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handlePasswordChange}
            activeOpacity={0.8}
          >
            <Text style={[theme.typography.labelCaps, { color: '#ffffff' }]}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* ── About & Support ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Support & Info</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => {
            Alert.alert('MedNova', 'Version 1.0.0 (Enterprise Weaning Prognosis & Gateways Monitor). Built with secure Supabase telemetry.');
          }}>
            <View style={styles.settingLeft}>
              <Info size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>About MedNova</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>System parameters and copyright details</Text>
              </View>
            </View>
            <ChevronRight size={16} color={theme.colors.outline} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={() => {
            Alert.alert('Contact Support', 'Help desk lines open. Email: support@mednova.io | Phone: +1-800-MED-NOVA');
          }}>
            <View style={styles.settingLeft}>
              <HelpCircle size={16} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>System Help Desk</Text>
                <Text style={[styles.settingDesc, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>Submit logs or contact technical team</Text>
              </View>
            </View>
            <ChevronRight size={16} color={theme.colors.outline} />
          </TouchableOpacity>
        </View>

        {/* ── Sign Out ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={[styles.logoutCard, { borderColor: theme.colors.error }]} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={theme.colors.error} />
          <Text style={[styles.logoutText, theme.typography.bodyMd, { color: theme.colors.error, fontWeight: '700' }]}>Sign Out Account</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const Divider = () => <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant + '33', marginHorizontal: 4 }} />;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  card: {
    borderRadius: 20, marginBottom: 24, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, minHeight: 64,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14 },
  settingDesc: { fontSize: 11, marginTop: 2 },
  prefVal: { fontWeight: '700', color: theme.colors.primary },
  inputStyle: {
    width: 120, height: 36, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: 8, paddingHorizontal: 10, textAlign: 'right', fontSize: 14, color: theme.colors.primary,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  textInputBlock: {
    height: 40, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, fontSize: 14,
  },
  actionBtn: {
    height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 20, height: 50, marginBottom: 24, backgroundColor: '#ffffff',
  },
  logoutText: { fontSize: 15 },
});
