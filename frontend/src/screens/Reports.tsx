import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { Search, Bell, Activity as ActiveIcon, FileText } from 'lucide-react-native';
import { Input } from '../components/common/Input';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const filteredReports = mockReports.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.author.toLowerCase().includes(search.toLowerCase())
  );

  const reportsContent = (
    <View style={styles.flex1}>
      {/* Top App Bar Header */}
      <View style={[styles.appBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.outlineVariant + '33' }]}>
        <View style={styles.appBarLeft}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL9jzPGC__Q1EgdkL1-ZIK676SXnnFnAvqyKxxTaDt3OuaR30FBwty5DudtuLXrMzc1xgwTcq9n5LFUpOqswww-QRtVKF0_9N0jG0Cq37p0u_R-O3kWRGb-pdj6Cr0zg2vD0TAqf1yxqxJGc3Uzn4yuaj0JGEspmWaJBS7hrOfRxXxbYzXOHJRlipb4UgW5Q6jTuZ05AcJrMcvF8QBabo1tsYo_vg1Tryruo9LpXc_f3vToQabcDU_dg' }}
            style={[styles.avatar, { borderColor: colors.outlineVariant }]}
          />
          <Text style={[typography.labelCaps, { color: colors.onSurface, fontWeight: 'bold' }]}>
            Dr. Sarah Mitchell
          </Text>
        </View>
        <Text style={[typography.headlineLgMobile, { color: colors.primary, fontWeight: 'bold' }]}>
          ICU Intel
        </Text>
        <TouchableOpacity style={styles.appBarIconButton}>
          <Search size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.headerSection, isDesktop ? styles.desktopPaddingHeader : null]}>
        <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700', marginBottom: 16 }]}>
          Clinical Reports
        </Text>
        
        {/* Recessed Inset Search Field */}
        <Input
          placeholder="Search reports by title or author..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.outline} />}
        />
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, isDesktop ? styles.desktopPaddingList : null]}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ReportViewer', { reportId: item.id })}
          >
            <Card variant="neumorphic" style={styles.reportCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWithIcon}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <FileText size={18} color={colors.primary} />
                  </View>
                  <View style={styles.titleMeta}>
                    <Text style={[typography.bodyMd, { color: colors.primary, fontWeight: '700' }]}>
                      {item.title}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                      By {item.author}
                    </Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.typeBadgeText, typography.labelCaps]}>
                    {item.type}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>
                  Created {item.date}
                </Text>
                <Text style={[typography.labelCaps, { color: colors.primary, fontWeight: 'bold', fontSize: 10 }]}>
                  VIEW REPORT
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              No clinical reports found matching "{search}"
            </Text>
          </View>
        }
      />
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        {/* Desktop sidebar */}
        <View style={[styles.desktopSidebar, { backgroundColor: colors.surface, borderRightColor: colors.outlineVariant + '33' }]}>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Patients')}
          >
            <ActiveIcon size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sidebarLink} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Bell size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sidebarLink, styles.sidebarLinkBottom]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Search size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 9, marginTop: 4 }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex1}>{reportsContent}</View>
      </View>
    );
  }

  return reportsContent;
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopSidebar: {
    width: 96,
    height: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    borderRightWidth: 1,
  },
  sidebarLink: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sidebarLinkActive: {
    position: 'relative',
  },
  activeIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarLinkBottom: {
    marginTop: 'auto',
    marginBottom: 0,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  appBarIconButton: {
    padding: 6,
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  desktopPaddingHeader: {
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  desktopPaddingList: {
    paddingHorizontal: 40,
  },
  reportCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleMeta: {
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

