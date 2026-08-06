import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [criticalEnabled, setCriticalEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Alert Settings</Text>
      
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Push Notifications</Text>
          <Text style={styles.desc}>Receive alerts on devices/patients offline status.</Text>
        </View>
        <Switch 
          value={pushEnabled} 
          onValueChange={setPushEnabled}
          trackColor={{ false: '#1f2833', true: '#66fcf1' }}
          thumbColor={pushEnabled ? '#0b0c10' : '#8f9091'}
        />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Critical Alerts Sound</Text>
          <Text style={styles.desc}>Override silent mode for high-risk AI alerts.</Text>
        </View>
        <Switch 
          value={criticalEnabled} 
          onValueChange={setCriticalEnabled}
          trackColor={{ false: '#1f2833', true: '#66fcf1' }}
          thumbColor={criticalEnabled ? '#0b0c10' : '#8f9091'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2833',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  desc: {
    fontSize: 11,
    color: '#8f9091',
    marginTop: 2,
    maxWidth: 220,
  },
});
