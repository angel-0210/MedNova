import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useRBAC } from '../../../contexts/RBACContext';
import { useUserProfileQuery, useUpdateUserProfileMutation } from '@mednova/hooks';
import { apiClient } from '@mednova/api';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon, LogOut, Shield, Info, ChevronRight,
  Phone, Mail, BadgeCheck, Stethoscope, Settings
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '../../../constants/theme';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Administrator',  color: theme.colors.statusCritical },
  doctor:    { label: 'Medical Doctor', color: theme.colors.statusStable },
  nurse:     { label: 'Registered Nurse', color: theme.colors.statusStable },
  attendant: { label: 'Patient Attendant', color: theme.colors.outline },
};

export default function ProfileScreen() {
  const { user: authUser, logout } = useAuth();
  const { role } = useRBAC();

  const userId = authUser?.user_id ?? '';

  // Queries & Mutations
  const { data: userProfile, isLoading: loadingProfile } = useUserProfileQuery(userId);
  const updateProfileMutation = useUpdateUserProfileMutation();

  const { data: hospital } = useQuery({
    queryKey: ['hospital', authUser?.hospital_id],
    queryFn: async () => {
      if (!authUser?.hospital_id) return null;
      const res = await apiClient.get(`/api/v1/hospitals/${authUser.hospital_id}`);
      return res.data;
    },
    enabled: !!authUser?.hospital_id,
  });

  // Local editing states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const startEditing = () => {
    setName(userProfile?.name ?? '');
    setPhone(userProfile?.phone ?? '');
    setDepartment(userProfile?.department ?? '');
    setLicenseNumber(userProfile?.license_number ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        data: {
          name,
          phone,
          department,
          license_number: licenseNumber
        }
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    }
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

  if (loadingProfile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const roleInfo = ROLE_LABELS[role] ?? { label: role.toUpperCase(), color: theme.colors.primary };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header Card ────────────────────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
          <View style={[styles.avatarWrap, { backgroundColor: 'rgba(0,10,36,0.05)', borderColor: theme.colors.outlineVariant }]}>
            {userProfile?.profile_picture ? (
              <Image source={{ uri: userProfile.profile_picture }} style={styles.avatarImg} />
            ) : (
              <UserIcon size={32} color={theme.colors.primary} strokeWidth={1.5} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, theme.typography.headlineLgMobile, { color: theme.colors.primary, fontWeight: '800' }]}>
              {userProfile?.name ?? 'Dr. Clinician'}
            </Text>
            <View style={styles.roleRow}>
              <View style={[styles.rolePill, { backgroundColor: roleInfo.color + '15' }]}>
                <Text style={[styles.roleText, theme.typography.labelCaps, { color: roleInfo.color, fontSize: 9, fontWeight: '800' }]}>
                  {roleInfo.label}
                </Text>
              </View>
            </View>
            <Text style={[styles.profileEmail, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>
              {userProfile?.email ?? '—'}
            </Text>
          </View>
        </View>

        {/* ── Edit State Inputs / Info ────────────────────────────────────────── */}
        {isEditing ? (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.inputLabel, theme.typography.labelCaps, { color: theme.colors.outline }]}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" />

            <Text style={[styles.inputLabel, theme.typography.labelCaps, { color: theme.colors.outline }]}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone Number" keyboardType="phone-pad" />

            <Text style={[styles.inputLabel, theme.typography.labelCaps, { color: theme.colors.outline }]}>Department</Text>
            <TextInput style={styles.input} value={department} onChangeText={setDepartment} placeholder="Department" />

            <Text style={[styles.inputLabel, theme.typography.labelCaps, { color: theme.colors.outline }]}>License Number</Text>
            <TextInput style={styles.input} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="License Number" />

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsEditing(false)} activeOpacity={0.8}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.outline }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
                <Text style={[theme.typography.labelCaps, { color: '#ffffff' }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Professional Details</Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <InfoRow icon={<BadgeCheck size={16} color={theme.colors.primary} />} label="License Number" value={userProfile?.license_number || 'Not Registered'} />
              <Divider />
              <InfoRow icon={<Stethoscope size={16} color={theme.colors.primary} />} label="Department" value={userProfile?.department || 'Not Configured'} />
              <Divider />
              <InfoRow icon={<Phone size={16} color={theme.colors.primary} />} label="Phone" value={userProfile?.phone || 'Not Configured'} />
              <Divider />
              <InfoRow icon={<Mail size={16} color={theme.colors.primary} />} label="Email" value={userProfile?.email || '—'} />
            </View>

            <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Hospital Scope</Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <InfoRow icon={<Shield size={16} color={theme.colors.primary} />} label="Facility Name" value={hospital?.name || 'Loading facility...'} />
              <Divider />
              <InfoRow icon={<Shield size={16} color={theme.colors.primary} />} label="Facility Code" value={hospital?.hospital_code || '—'} />
            </View>

            {/* Edit / Navigation Buttons */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.outlineVariant }]} onPress={startEditing} activeOpacity={0.8}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.primary }]}>Edit Profile Details</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>Preferences</Text>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.backgroundMain, borderColor: theme.colors.outlineVariant }]}>
              <TouchableOpacity style={styles.navRow} activeOpacity={0.7} onPress={() => router.push('/settings')}>
                <View style={styles.navLeft}>
                  <View style={[styles.navIconWrap, { backgroundColor: 'rgba(0,10,36,0.05)' }]}>
                    <Settings size={16} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.navLabel, theme.typography.bodyMd, { color: theme.colors.primary, fontWeight: '600' }]}>App Settings</Text>
                </View>
                <ChevronRight size={14} color={theme.colors.outline} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Sign Out ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={[styles.logoutCard, { borderColor: theme.colors.error }]} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={theme.colors.error} />
          <Text style={[styles.logoutText, theme.typography.bodyMd, { color: theme.colors.error, fontWeight: '700' }]}>Sign Out Account</Text>
        </TouchableOpacity>

        <Text style={[styles.version, theme.typography.bodySm, { color: theme.colors.outline }]}>MedNova Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Divider = () => <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant + '33', marginHorizontal: 4 }} />;

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={[styles.rowLabel, theme.typography.bodySm, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
    <Text style={[styles.rowValue, theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 80 },

  profileCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 24, borderWidth: 1,
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  avatarImg: { width: 64, height: 64 },
  profileInfo: { flex: 1 },
  profileName: { },
  roleRow: { marginTop: 6, marginBottom: 4 },
  rolePill: { alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 10, fontWeight: '700' },
  profileEmail: { },

  sectionTitle: { textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 12 },

  infoCard: {
    borderRadius: 20, marginBottom: 20, padding: 12, borderWidth: 1,
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 16 },

  inputLabel: { textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10, marginTop: 10, paddingHorizontal: 8 },
  input: {
    height: 40, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: 10, paddingHorizontal: 12, marginTop: 4, marginBottom: 10, fontSize: 14, marginHorizontal: 8
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginHorizontal: 8, marginBottom: 8 },
  btn: { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { borderWidth: 1, borderColor: theme.colors.outlineVariant },
  saveBtn: { },

  actionBtnRow: { marginBottom: 20 },
  actionBtn: {
    borderWidth: 1, borderRadius: 16, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff'
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, height: 44
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navLabel: { fontSize: 14 },

  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 20, height: 50, marginTop: 12, marginBottom: 24, backgroundColor: '#ffffff',
  },
  logoutText: { fontSize: 15 },
  version: { textAlign: 'center', fontSize: 10, opacity: 0.4, marginBottom: 20 }
});
