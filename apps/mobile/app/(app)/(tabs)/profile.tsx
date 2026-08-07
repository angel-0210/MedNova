import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRBAC } from '../../../contexts/RBACContext';
import {
  User as UserIcon, LogOut, Bell, Volume2,
  Shield, Info, ChevronRight, Moon,
} from 'lucide-react-native';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Administrator',  color: '#fca311' },
  doctor:    { label: 'Medical Doctor', color: '#66fcf1' },
  nurse:     { label: 'Registered Nurse', color: '#2a9d8f' },
  attendant: { label: 'Patient Attendant', color: '#5a5c5e' },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { role } = useRBAC();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [criticalSound, setCriticalSound] = useState(true);

  const roleInfo = ROLE_LABELS[role] ?? { label: role.toUpperCase(), color: '#66fcf1' };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Profile Card ───────────────────────────────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <UserIcon size={32} color="#66fcf1" strokeWidth={1.5} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? 'Clinical Staff'}</Text>
          <View style={styles.roleRow}>
            <View style={[styles.rolePill, { backgroundColor: roleInfo.color + '20' }]}>
              <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
            </View>
          </View>
          <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* ── Permissions ────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Your Access Level</Text>
      <View style={styles.permCard}>
        <PermRow icon={<Shield size={14} color="#66fcf1" />} label="Role" value={roleInfo.label} />
        <Divider />
        <PermRow icon={<Shield size={14} color="#2a9d8f" />} label="Hospital Scope" value={user?.hospital_id ? '✓ Scoped' : '—'} />
      </View>

      {/* ── Notification Settings ──────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Bell size={16} color="#66fcf1" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Alert notifications for device & patient events</Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#252b36', true: '#66fcf1' }}
            thumbColor={pushEnabled ? '#0b0c10' : '#5a5c5e'}
            ios_backgroundColor="#252b36"
          />
        </View>
        <Divider />
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Volume2 size={16} color={criticalSound ? '#d90429' : '#5a5c5e'} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Critical Alert Sound</Text>
              <Text style={styles.settingDesc}>Override silent mode for high-risk AI alerts</Text>
            </View>
          </View>
          <Switch
            value={criticalSound}
            onValueChange={setCriticalSound}
            trackColor={{ false: '#252b36', true: '#d90429' }}
            thumbColor={criticalSound ? '#0b0c10' : '#5a5c5e'}
            ios_backgroundColor="#252b36"
          />
        </View>
      </View>

      {/* ── App Info ───────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Application</Text>
      <View style={styles.card}>
        <NavRow icon={<Info size={16} color="#66fcf1" />} label="About MedNova" />
        <Divider />
        <NavRow icon={<Moon size={16} color="#66fcf1" />} label="Appearance" />
      </View>

      {/* ── Sign Out ───────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color="#d90429" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MedNova Mobile v1.0.0</Text>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginHorizontal: 4 }} />;

const PermRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.permRow}>
    {icon}
    <Text style={styles.permLabel}>{label}</Text>
    <Text style={styles.permValue}>{value}</Text>
  </View>
);

const NavRow: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
    <View style={styles.navLeft}>
      <View style={styles.navIconWrap}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
    </View>
    <ChevronRight size={14} color="#3a3e46" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  scroll: { padding: 20, paddingBottom: 80 },

  profileCard: {
    backgroundColor: '#1a2130', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 28,
    borderWidth: 1, borderColor: 'rgba(102,252,241,0.1)',
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(102,252,241,0.08)',
    borderWidth: 2, borderColor: 'rgba(102,252,241,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  roleRow: { marginTop: 6, marginBottom: 4 },
  rolePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 10, fontWeight: '700' },
  profileEmail: { fontSize: 12, color: '#5a5c5e' },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#5a5c5e',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },

  card: {
    backgroundColor: '#1a2130', borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden',
  },
  permCard: {
    backgroundColor: '#1a2130', borderRadius: 16, marginBottom: 24,
    paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  permLabel: { fontSize: 13, color: '#8f9091', flex: 1 },
  permValue: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  settingDesc: { fontSize: 11, color: '#5a5c5e', marginTop: 2, lineHeight: 16 },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(102,252,241,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel: { fontSize: 14, fontWeight: '600', color: '#e2e4e6' },

  logoutCard: {
    backgroundColor: 'rgba(217,4,41,0.08)',
    borderWidth: 1, borderColor: 'rgba(217,4,41,0.2)',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 24,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#d90429' },

  version: { fontSize: 11, color: '#2a2e36', textAlign: 'center', fontWeight: '600' },
});
