import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Activity, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react-native';
import { apiClient } from '@mednova/api';
import { parseAPIError } from '@mednova/utils';

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
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color="#2a9d8f" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            A password reset link has been sent to{'\n'}
            <Text style={{ color: '#66fcf1', fontWeight: '700' }}>{email}</Text>
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Back button ─────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#66fcf1" />
          <Text style={styles.backText}>Login</Text>
        </TouchableOpacity>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Activity size={28} color="#66fcf1" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your hospital email and we'll send a secure reset link.
          </Text>
        </View>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hospital Email</Text>
            <View style={styles.inputRow}>
              <Mail size={16} color="#5a5c5e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="doctor@hospital.org"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0b0c10" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0c10' },
  scroll: { flexGrow: 1, padding: 24 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 32, marginTop: 8,
  },
  backText: { color: '#66fcf1', fontSize: 14, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    height: 60, width: 60, backgroundColor: 'rgba(102,252,241,0.1)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(102,252,241,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  subtitle: {
    fontSize: 13, color: '#5a5c5e', textAlign: 'center', marginTop: 8, lineHeight: 20,
  },

  form: {},
  errorBox: {
    backgroundColor: 'rgba(217,4,41,0.12)', borderColor: 'rgba(217,4,41,0.25)',
    borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16,
  },
  errorText: { color: '#d90429', fontSize: 12, textAlign: 'center', fontWeight: '600' },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 10, fontWeight: '700', color: '#5a5c5e',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  inputRow: {
    backgroundColor: '#1a2130', borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#ffffff', fontSize: 14, paddingVertical: 14 },

  button: {
    backgroundColor: '#66fcf1', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#66fcf1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#0b0c10', fontSize: 14, fontWeight: '700' },

  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(42,157,143,0.1)',
    borderWidth: 1, borderColor: 'rgba(42,157,143,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  successText: { fontSize: 14, color: '#5a5c5e', textAlign: 'center', lineHeight: 22 },
});
