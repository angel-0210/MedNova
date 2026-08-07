import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { useAuthStore } from '../stores';
import { useTheme } from '../theme/ThemeProvider';
import { websocketManager } from '../services/websocketManager';
import { Shield, Mail, Lock, Eye, EyeOff, Fingerprint, ArrowRight } from 'lucide-react-native';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { login, loading, error } = useAuthStore();
  const [secureText, setSecureText] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      await websocketManager.connect();
      navigation.reset({
        index: 0,
        routes: [{ name: 'App' }],
      });
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Glassmorphic Login Card */}
        <Card variant="glass" style={styles.loginCard}>
          
          {/* Branding Header */}
          <View style={styles.header}>
            <View style={[styles.logoIconBg, { backgroundColor: colors.primary }]}>
              <Shield size={26} color={colors.onPrimary} />
            </View>
            <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700', marginTop: 12 }]}>
              MedNova
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, fontWeight: '500' }]}>
              Secure Clinical Access
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
                <Text style={[typography.bodySm, { color: colors.onErrorContainer, textAlign: 'center', fontWeight: '500' }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Hospital ID Input (Bound to email) */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Hospital ID Email"
                  placeholder="doctor@hospital.org"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color={colors.outline} />}
                />
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={colors.outline} />}
                  rightElement={
                    <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                      {secureText ? (
                        <EyeOff size={18} color={colors.outline} />
                      ) : (
                        <Eye size={18} color={colors.outline} />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />

            {/* Auxiliary Actions (Remember Me / Forgot Password) */}
            <View style={styles.auxRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.outlineVariant,
                      backgroundColor: rememberMe ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {rememberMe && <View style={styles.checkedIndicator} />}
                </View>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginLeft: 8 }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold' }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleSubmit(onSubmit)}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.7 : 1,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 2,
                },
              ]}
            >
              <Text style={[typography.labelCaps, { color: colors.onPrimary, fontWeight: 'bold', fontSize: 13 }]}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Text>
              {!loading && <ArrowRight size={16} color={colors.onPrimary} style={styles.submitArrow} />}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant + '4D' }]} />
            <Text style={[typography.labelCaps, { color: colors.outline, marginHorizontal: 12 }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant + '4D' }]} />
          </View>

          {/* Bio-ID Option (Soft Neumorphic Button) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.bioBtn,
              {
                backgroundColor: colors.background,
                borderColor: '#ffffff',
                borderWidth: 1.5,
                shadowColor: '#000000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
                elevation: 1,
              },
            ]}
          >
            <Fingerprint size={20} color={colors.primary} style={styles.bioIcon} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold', fontSize: 12 }]}>
              Sign In with Bio-ID
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Footer Warning Info */}
        <View style={styles.footerWarning}>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, opacity: 0.7, textAlign: 'center' }]}>
            Unauthorized access is strictly prohibited.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconBg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  auxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitArrow: {
    marginLeft: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  bioBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioIcon: {
    marginRight: 10,
  },
  footerWarning: {
    marginTop: 24,
    alignItems: 'center',
  },
});

