import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Switch, ScrollView, useWindowDimensions } from 'react-native';
import { Activity, Bot, AlertTriangle, Wifi, Search, Sliders, ChevronDown, Smartphone, MessageSquare, Check, Bell, Activity as ActiveIcon } from 'lucide-react-native';
import { useAlertStore, usePatientStore } from '../stores';
import { Card } from '../components/common/Card';
import { useTheme } from '../theme/ThemeProvider';
import { Alert as DBAlert } from '../types';

export const Alerts: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { activeAlerts, fetchActiveAlerts, acknowledge, resolve } = useAlertStore();
  const { patients, fetchPatients } = usePatientStore();

  const [activeSegment, setActiveSegment] = useState<'active' | 'center'>('active');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    fetchActiveAlerts();
    fetchPatients();
  }, [fetchActiveAlerts, fetchPatients]);

  const getPatientDetails = (patientId: string) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    if (!patient) return { name: 'System Event', bed: 'System', meta: 'Infrastructure' };
    return {
      name: patient.name,
      bed: patient.bed_number ? `Bed ${patient.bed_number}` : 'Bed N/A',
      meta: `${patient.name} • ${patient.age}${patient.gender[0]}`
    };
  };

  const getAlertMetadata = (alert: DBAlert) => {
    const type = alert.alert_type;
    const msg = alert.message.toLowerCase();

    if (type === 'critical') {
      return {
        badge: 'Critical',
        badgeBg: colors.statusCritical,
        badgeTextColor: '#FFFFFF',
        icon: <Activity size={18} color="#FFFFFF" />,
        boxTitle: 'Ventilator Pressure Alert - Bed 4',
        timestamp: 'Just now',
        leftAccent: colors.statusCritical
      };
    } else if (msg.includes('sepsis') || type === 'high') {
      return {
        badge: 'AI Predictive',
        badgeBg: colors.statusCritical,
        badgeTextColor: '#FFFFFF',
        icon: <Bot size={18} color="#FFFFFF" />,
        boxTitle: 'High Risk: Sepsis Onset',
        timestamp: '2m ago',
        leftAccent: colors.statusCritical
      };
    } else if (msg.includes('fluid') || type === 'medium') {
      return {
        badge: 'Warning',
        badgeBg: colors.surfaceContainer,
        badgeTextColor: colors.statusStable,
        icon: <AlertTriangle size={18} color={colors.statusStable} />,
        boxTitle: 'IV Fluid Low',
        timestamp: '15m ago',
        leftAccent: colors.secondaryContainer
      };
    } else {
      return {
        badge: 'Routine',
        badgeBg: colors.surfaceContainerHighest,
        badgeTextColor: colors.primary,
        icon: <Wifi size={18} color={colors.outline} />,
        boxTitle: 'Telemetry Sensor Calibration',
        timestamp: '1h ago',
        leftAccent: colors.primary
      };
    }
  };

  const renderAlertItem = ({ item }: { item: DBAlert }) => {
    const p = getPatientDetails(item.patient_id);
    const meta = getAlertMetadata(item);

    return (
      <Card
        variant="neumorphic"
        style={[
          styles.alertCard,
          { borderLeftColor: meta.leftAccent }
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <View style={styles.badgeLabelRow}>
              <View style={[
                styles.iconCircle,
                { backgroundColor: meta.leftAccent + '1A' }
              ]}>
                {meta.icon}
              </View>
              <Text style={[styles.bedTitleText, { color: colors.primary }]}>{p.bed}</Text>

              <View style={[styles.statusChip, { backgroundColor: meta.badgeBg }]}>
                <Text style={[styles.statusChipText, { color: meta.badgeTextColor }]}>
                  {meta.badge}
                </Text>
              </View>
            </View>

            <Text style={[
              styles.timestampText,
              meta.timestamp === 'Just now' ? { color: colors.statusCritical, fontWeight: '700' } : null
            ]}>
              {meta.timestamp}
            </Text>
          </View>

          <Text style={styles.patientSubtitleText}>{p.meta}</Text>

          <View style={styles.messageBox}>
            <Text style={styles.messageBoxTitle}>{meta.boxTitle}</Text>
            <Text style={styles.messageBoxBody}>{item.message}</Text>
          </View>

          <View style={styles.cardActionsRow}>
            {item.alert_type === 'critical' ? (
              <>
                <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                  <Text style={styles.btnTextWhite}>View Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnSecondary} activeOpacity={0.8} onPress={() => resolve(item.alert_id)}>
                  <Text style={styles.btnTextGrey}>Dismiss</Text>
                </TouchableOpacity>
              </>
            ) : item.alert_type === 'high' ? (
              <>
                <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                  <Text style={styles.btnTextWhite}>Review Model</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnSecondary} activeOpacity={0.8} onPress={() => resolve(item.alert_id)}>
                  <Text style={styles.btnTextGrey}>Dismiss</Text>
                </TouchableOpacity>
              </>
            ) : item.alert_type === 'medium' || item.alert_type === 'low' ? (
              <TouchableOpacity style={styles.actionBtnOutline} activeOpacity={0.8} onPress={() => acknowledge(item.alert_id)}>
                <Text style={styles.btnTextOutline}>Acknowledge</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionBtnOutline} activeOpacity={0.8}>
                <Text style={styles.btnTextOutline}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const notificationGroups = [
    {
      title: 'TODAY',
      data: [
        {
          id: 'n1',
          type: 'critical_alert',
          title: 'Ventilator Pressure Alert - Bed 4',
          time: '10:42 AM',
          message: 'High airway pressure detected. AI insight suggests possible secretion buildup. Please review patient status immediately.',
          icon: <AlertTriangle size={18} color={colors.statusCritical} />,
          iconBg: colors.statusCritical + '1A',
          leftAccent: colors.statusCritical,
          actions: (
            <View style={[styles.cardActionsRow, { marginTop: 12 }]}>
              <TouchableOpacity style={[styles.actionBtnPrimaryCompact, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Text style={styles.btnTextWhiteCompact}>Acknowledge</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondaryCompact} activeOpacity={0.8}>
                <Text style={styles.btnTextGreyCompact}>View Chart</Text>
              </TouchableOpacity>
            </View>
          )
        },
        {
          id: 'n2',
          type: 'system',
          title: 'System Update Scheduled',
          time: '08:00 AM',
          message: 'MedNova v2.4.1 will be deployed at 02:00 AM tomorrow. Brief downtime (approx 5 mins) expected. Read release notes for details.',
          icon: <Smartphone size={18} color={colors.outline} />,
          iconBg: colors.surfaceContainerHighest,
          leftAccent: null,
          actions: null
        }
      ]
    },
    {
      title: 'YESTERDAY',
      data: [
        {
          id: 'n3',
          type: 'notes',
          title: 'Shift Handoff Notes Available',
          time: 'Yesterday, 7:00 PM',
          message: 'Dr. Patel has uploaded the evening shift handoff notes for Ward B.',
          icon: <MessageSquare size={18} color={colors.outline} />,
          iconBg: colors.surfaceContainerHighest,
          leftAccent: null,
          actions: null
        }
      ]
    },
    {
      title: 'OLDER',
      data: [
        {
          id: 'n4',
          type: 'patch',
          title: 'Security Patch Applied',
          time: 'Oct 24',
          message: 'Mandatory security patch applied successfully across all monitoring nodes.',
          icon: <Check size={16} color={colors.outline} />,
          iconBg: colors.surfaceContainerHighest,
          leftAccent: null,
          actions: null
        }
      ]
    }
  ];

  const alertsContent = (
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

      {/* Segment view switcher control */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentTrack}>
          <TouchableOpacity
            style={[styles.segmentTab, activeSegment === 'active' ? styles.segmentTabActive : null]}
            onPress={() => setActiveSegment('active')}
          >
            <Text style={[styles.segmentTabText, activeSegment === 'active' ? styles.segmentTabTextActive : null]}>
              Active Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, activeSegment === 'center' ? styles.segmentTabActive : null]}
            onPress={() => setActiveSegment('center')}
          >
            <Text style={[styles.segmentTabText, activeSegment === 'center' ? styles.segmentTabTextActive : null]}>
              Notifications Center
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Alerts View */}
      {activeSegment === 'active' && (
        <View style={styles.flex1}>
          <View style={[styles.screenHeader, isDesktop ? styles.desktopPaddingHeader : null]}>
            <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700' }]}>Active Alerts</Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 16 }]}>
              Monitoring 12 critical beds
            </Text>

            <View style={styles.filtersRow}>
              <TouchableOpacity style={styles.filterSelectorBtn} activeOpacity={0.8}>
                <Sliders size={15} color={colors.primary} style={styles.filterIconLeft} />
                <Text style={styles.filterText}>All Alert Types</Text>
                <ChevronDown size={15} color={colors.primary} style={styles.filterIconRight} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterSelectorBtn} activeOpacity={0.8}>
                <Sliders size={15} color={colors.primary} style={styles.filterIconLeft} />
                <Text style={styles.filterText}>Bed #</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={activeAlerts}
            keyExtractor={(item) => item.alert_id}
            contentContainerStyle={[styles.listContent, isDesktop ? styles.desktopPaddingList : null]}
            renderItem={renderAlertItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[typography.bodyMd, { color: colors.outline, fontWeight: '500' }]}>
                  No active clinical alerts at this time.
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Notifications Center View */}
      {activeSegment === 'center' && (
        <View style={styles.flex1}>
          <View style={[styles.screenHeader, styles.notificationHeaderRow, isDesktop ? styles.desktopPaddingHeader : null]}>
            <View>
              <Text style={[typography.displayLg, { color: colors.primary, fontWeight: '700' }]}>Notifications Center</Text>
            </View>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Priority{"\n"}Only</Text>
              <Switch
                value={priorityOnly}
                onValueChange={setPriorityOnly}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={[styles.listContent, isDesktop ? styles.desktopPaddingList : null]} showsVerticalScrollIndicator={false}>
            {notificationGroups.map((group) => {
              // Filter based on Priority switch
              const filteredData = priorityOnly
                ? group.data.filter(item => item.type === 'critical_alert')
                : group.data;

              if (filteredData.length === 0) return null;

              return (
                <View key={group.title} style={styles.groupBlock}>
                  {/* Time Section Divider */}
                  <View style={styles.sectionDividerRow}>
                    <Text style={styles.sectionDividerText}>{group.title}</Text>
                  </View>

                  {filteredData.map((item) => (
                    <Card
                      key={item.id}
                      variant="neumorphic"
                      style={[
                        styles.alertCard,
                        item.leftAccent ? { borderLeftColor: item.leftAccent, borderLeftWidth: 5 } : null
                      ]}
                    >
                      <View style={styles.cardContent}>
                        {/* Top Line: Icon, Title, Time */}
                        <View style={styles.notifyHeaderRow}>
                          <View style={styles.notifyTitleGroup}>
                            <View style={[styles.iconCircleCompact, { backgroundColor: item.iconBg }]}>
                              {item.icon}
                            </View>
                            <Text style={[styles.notifyTitleText, { color: colors.primary }]}>
                              {item.title}
                            </Text>
                          </View>
                          <Text style={styles.notifyTimeText}>{item.time}</Text>
                        </View>

                        {/* Body description */}
                        <Text style={styles.notifyBodyText}>{item.message}</Text>

                        {/* Custom Buttons */}
                        {item.actions}
                      </View>
                    </Card>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
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
            style={[styles.sidebarLink, styles.sidebarLinkActive, { backgroundColor: colors.secondaryContainer + '33' }]}
            activeOpacity={0.8}
          >
            <View style={[styles.activeIndicatorBar, { backgroundColor: colors.primary }]} />
            <Bell size={20} color={colors.primary} />
            <Text style={[typography.labelCaps, { color: colors.primary, fontSize: 9, marginTop: 4, fontWeight: 'bold' }]}>
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
        <View style={styles.flex1}>{alertsContent}</View>
      </View>
    );
  }

  return alertsContent;
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
  // Segment Switcher
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 10, 36, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#1E293B',
  },
  // Screen Title Details
  screenHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  desktopPaddingHeader: {
    paddingHorizontal: 40,
    paddingTop: 32,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginRight: 8,
    textAlign: 'right',
    lineHeight: 14,
  },
  // Filters Selector
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  filterIconLeft: {
    marginRight: 8,
  },
  filterIconRight: {
    marginLeft: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  desktopPaddingList: {
    paddingHorizontal: 40,
  },
  // Group Divider
  groupBlock: {
    marginBottom: 20,
  },
  sectionDividerRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#64748B',
    paddingLeft: 8,
    marginBottom: 12,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  // Notification center item titles
  notifyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircleCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notifyTitleText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  notifyTimeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifyBodyText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 19,
    marginTop: 8,
    fontWeight: '500',
  },
  // Alert Cards
  alertCard: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: 'transparent',
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bedTitleText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginRight: 8,
  },
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  patientSubtitleText: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 14,
    paddingLeft: 42,
  },
  messageBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  messageBoxTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  messageBoxBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1.2,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSecondary: {
    flex: 1,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  actionBtnOutline: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionBtnPrimaryCompact: {
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionBtnSecondaryCompact: {
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextGrey: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextOutline: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextWhiteCompact: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextGreyCompact: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
