import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

export const ForgotPassword: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card variant="glass" style={styles.card}>
          <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: '700', textAlign: 'center' }]}>
            Reset Security Password
          </Text>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 24, textAlign: 'center' }]}>
            Enter your registered institutional email. We will send password reset instructions to your clinical mailbox.
          </Text>
          
          <Input 
            label="Institutional Email" 
            placeholder="doctor@hospital.org" 
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Button 
            title="Send Reset Link" 
            variant="primary"
            style={styles.submitBtn}
            onPress={() => navigation.goBack()} 
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 24,
  },
  submitBtn: {
    marginTop: 8,
  },
});
