import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeProvider';

export const ForgotPassword: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
        Reset Security Password
      </Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 24 }]}>
        Enter your registered institutional email. We will send password reset instructions to your clinical mailbox.
      </Text>
      <Input label="Institutional Email" placeholder="doctor@hospital.org" />
      <Button title="Send Reset Link" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
});
