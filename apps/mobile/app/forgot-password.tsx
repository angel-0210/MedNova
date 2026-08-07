import React, { useState } from 'react';
import {
  StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Text, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Activity, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '@mednova/api';
import { parseAPIError } from '@mednova/utils';
import { theme } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your hospital email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(parseAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: 'rgba(20,33,61,0.06)', borderColor: theme.colors.outlineVariant }]}>
            <CheckCircle2 size={40} color={theme.colors.primary} />
          </View>
          <Text style={[theme.typography.headlineLg, { color: theme.colors.primary, fontWeight: '800' }]}>
            Check Your Email
          </Text>
          <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 }]}>
            A password reset link has been sent to{'\n'}
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{email}</Text>
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary, width: '100%' }]} 
            onPress={() => router.replace('/login')} 
            activeOpacity={0.8}
          >
            <Text style={[theme.typography.bodyMd, { color: theme.colors.onPrimary, fontWeight: '700' }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Back button ─────────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={18} color={theme.colors.primary} />
            <Text style={[theme.typography.bodySm, { color: theme.colors.primary, fontWeight: '700' }]}>
              Login
            </Text>
          </TouchableOpacity>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: 'rgba(0,10,36,0.05)', borderColor: theme.colors.outlineVariant }]}>
              <Activity size={28} color={theme.colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={[theme.typography.headlineLg, { color: theme.colors.primary, fontWeight: '800', textAlign: 'center' }]}>
              Forgot Password
            </Text>
            <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, lineHeight: 20 }]}>
              Enter your hospital email and we'll send a secure reset link.
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────────────────────────── */}
          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
                <Text style={[theme.typography.bodySm, { color: theme.colors.onErrorContainer, textAlign: 'center', fontWeight: '600' }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, marginBottom: 8 }]}>
                Hospital Email
              </Text>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerHighest, borderColor: theme.colors.outlineVariant }]}>
                <Mail size={16} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, theme.typography.bodyMd, { color: theme.colors.onSurface }]}
                  placeholder="doctor@hospital.org"
                  placeholderTextColor={theme.colors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Text style={[theme.typography.bodyMd, { color: theme.colors.onPrimary, fontWeight: '700' }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 32, marginTop: 8,
  },

  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    height: 60, width: 60,
    borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },

  form: {},
  errorBox: {
    borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16,
  },

  inputGroup: { marginBottom: 20 },
  inputRow: {
    borderWidth: 1, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14 },

  button: {
    borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },

  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
