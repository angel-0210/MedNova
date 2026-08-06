import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserIcon } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <UserIcon size={36} color="#66fcf1" />
      </View>
      <Text style={styles.name}>{user?.name || 'Dr. Mitchell'}</Text>
      <Text style={styles.role}>{user?.role?.toUpperCase() || 'DOCTOR'}</Text>
      <Text style={styles.email}>{user?.email || 'doctor@hospital.org'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: '#1f2833',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.2)',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  role: {
    fontSize: 12,
    color: '#66fcf1',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  email: {
    fontSize: 14,
    color: '#8f9091',
    marginTop: 12,
  },
});
