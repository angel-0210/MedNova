import React, { useState } from 'react';
import {
  StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Text, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Mail, Lock } from 'lucide-react-native';
import { parseAPIError } from '@mednova/utils';
import { router } from 'expo-router';
import { theme } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all security credentials.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(parseAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: 'rgba(0,10,36,0.05)', borderColor: theme.colors.outlineVariant }]}>
              <Activity size={32} color={theme.colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={[theme.typography.headlineLg, { color: theme.colors.primary, fontWeight: '800', textAlign: 'center' }]}>
              MedNova
            </Text>
            <Text style={[theme.typography.bodySm, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
              Ventilator Telemetry Portal
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
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant }]}>
                  Security Password
                </Text>
                <TouchableOpacity onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                  <Text style={[theme.typography.bodySm, { color: theme.colors.secondaryContainer, fontWeight: '700' }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerHighest, borderColor: theme.colors.outlineVariant }]}>
                <Lock size={16} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, theme.typography.bodyMd, { color: theme.colors.onSurface }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.outline}
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
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
                  Authenticate Session
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    height: 68, width: 68,
    borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },

  form: {},
  errorBox: {
    borderWidth: 1, padding: 12, borderRadius: 12, marginBottom: 16,
  },

  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },

  inputRow: {
    borderWidth: 1, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14 },

  button: {
    borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
});
