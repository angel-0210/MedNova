import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';

interface Report {
  id: string;
  title: string;
  date: string;
  author: string;
  type: string;
}

const mockReports: Report[] = [
  { id: '1', title: 'Ventilation Summary - ICU Ward A', date: '2026-08-04', author: 'Dr. Mitchell', type: 'Summary' },
  { id: '2', title: 'Blood Gas Analysis - Bed 402', date: '2026-08-05', author: 'Dr. Sarah Mitchell', type: 'Lab' },
  { id: '3', title: 'Weaning Protocol Assessment', date: '2026-08-03', author: 'Nurse Henderson', type: 'Clinical' },
  { id: '4', title: 'Daily Patient Summary Report', date: '2026-08-05', author: 'Dr. Sarah Mitchell', type: 'Daily' },
];

export const Reports: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const [search, setSearch] = useState('');

  const filteredReports = mockReports.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          Clinical Reports
        </Text>
        <TextInput
          placeholder="Search reports by title or author..."
          placeholderTextColor={colors.onSurfaceVariant + '80'}
          style={[
            styles.searchBar,
            typography.bodyMd,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant + '33',
              color: colors.onSurface,
            },
          ]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ReportViewer', { reportId: item.id })}
          >
            <Card variant="neumorphic" style={styles.reportCard}>
              <View style={styles.cardHeader}>
                <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: 'bold' }]}>
                  {item.title}
                </Text>
                <Text style={[styles.typeBadge, typography.labelCaps, { color: colors.primary, backgroundColor: colors.surfaceContainerHigh }]}>
                  {item.type}
                </Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  By {item.author}
                </Text>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  {item.date}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  searchBar: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    overflow: 'hidden',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 8,
  },
});
