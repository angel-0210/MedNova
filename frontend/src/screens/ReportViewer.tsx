import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeProvider';

export const ReportViewer: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { reportId } = route.params;
  const { colors, typography } = useTheme();

  const handleExport = () => {
    Alert.alert('Export Complete', 'The PDF report was exported to your device files.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="sterile" style={styles.pdfPage}>
          <View style={styles.pdfHeader}>
            <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
              MedNova Health Report
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              Report Reference ID: #MN-2026-{reportId}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={[typography.labelCaps, { color: colors.primary }]}>Patient Identification</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, marginTop: 4 }]}>
              Name: John Doe  •  Age: 58  •  Gender: Male  •  Bed: Room 402
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.labelCaps, { color: colors.primary }]}>Clinical Evaluation Summary</Text>
            <Text style={[typography.bodySm, { color: colors.onSurface, marginTop: 6, lineHeight: 20 }]}>
              The patient's oxygen saturation (SpO2) remained stable at 96.5% during the last monitoring window. 
              Heart rate averages 74.0 BPM with no signs of tachycardia. AI-driven risk index estimates low probability (15%) of critical obstruction events. 
              Recommendation is to continue current ventilator weaning protocols.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.labelCaps, { color: colors.primary }]}>Signatures</Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, fontStyle: 'italic' }]}>
              Digitally certified by Dr. Sarah Mitchell on 2026-08-05
            </Text>
          </View>
        </Card>

        <Button 
          title="Export PDF Document" 
          onPress={handleExport}
          style={styles.exportBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pdfPage: {
    padding: 24,
    minHeight: 400,
    backgroundColor: '#ffffff',
  },
  pdfHeader: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  exportBtn: {
    marginTop: 20,
  },
});
