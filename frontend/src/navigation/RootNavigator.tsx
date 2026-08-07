import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  AuthStackParamList, 
  DashboardStackParamList, 
  PatientStackParamList, 
  AlertsStackParamList, 
  ReportsStackParamList, 
  DeviceStackParamList, 
  SettingsStackParamList, 
  AppTabParamList, 
  RootStackParamList 
} from './types';

// Import Screens
import { Splash } from '../screens/Splash';
import { Login } from '../screens/Login';
import { ForgotPassword } from '../screens/ForgotPassword';
import { Dashboard } from '../screens/Dashboard';
import { PatientList } from '../screens/PatientList';
import { PatientDetails } from '../screens/PatientDetails';
import { Alerts } from '../screens/Alerts';
import { Reports } from '../screens/Reports';
import { ReportViewer } from '../screens/ReportViewer';
import { DeviceManagement } from '../screens/DeviceManagement';
import { BLEPairing } from '../screens/BLEPairing';
import { Settings } from '../screens/Settings';
import { Help } from '../screens/Help';
import { About } from '../screens/About';

import { useTheme } from '../theme/ThemeProvider';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

const DashboardStack = createStackNavigator<DashboardStackParamList>();
const PatientStack = createStackNavigator<PatientStackParamList>();
const AlertsStack = createStackNavigator<AlertsStackParamList>();
const ReportsStack = createStackNavigator<ReportsStackParamList>();
const DeviceStack = createStackNavigator<DeviceStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Auth Navigator
export const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Splash" component={Splash} />
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
  </AuthStack.Navigator>
);

// Tab Sub-Stacks
const DashboardNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardHome" component={Dashboard} />
  </DashboardStack.Navigator>
);

const PatientNavigator = () => (
  <PatientStack.Navigator screenOptions={{ headerShown: false }}>
    <PatientStack.Screen name="PatientListHome" component={PatientList} />
    <PatientStack.Screen name="PatientDetails" component={PatientDetails} />
  </PatientStack.Navigator>
);

const AlertsNavigator = () => (
  <AlertsStack.Navigator screenOptions={{ headerShown: false }}>
    <AlertsStack.Screen name="AlertsHome" component={Alerts} />
  </AlertsStack.Navigator>
);

const ReportsNavigator = () => (
  <ReportsStack.Navigator screenOptions={{ headerShown: false }}>
    <ReportsStack.Screen name="ReportsHome" component={Reports} />
    <ReportsStack.Screen name="ReportViewer" component={ReportViewer} />
  </ReportsStack.Navigator>
);

const DeviceNavigator = () => (
  <DeviceStack.Navigator screenOptions={{ headerShown: false }}>
    <DeviceStack.Screen name="DeviceHome" component={DeviceManagement} />
    <DeviceStack.Screen name="BLEPairing" component={BLEPairing} />
  </DeviceStack.Navigator>
);

const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsHome" component={Settings} />
    <SettingsStack.Screen name="Help" component={Help} />
    <SettingsStack.Screen name="About" component={About} />
  </SettingsStack.Navigator>
);

// Main Bottom Tab Navigator
export const AppTabs = () => {
  const { colors, typography } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          display: width >= 768 ? 'none' : 'flex',
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant + '33',
          height: 80,
          paddingBottom: 12,
        },
        tabBarLabelStyle: typography.labelCaps,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Patients" component={PatientNavigator} />
      <Tab.Screen name="Alerts" component={AlertsNavigator} />
      <Tab.Screen
        name="Reports"
        component={ReportsNavigator}
      />
      <Tab.Screen name="Devices" component={DeviceNavigator} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
};


// Root Navigator
export const RootNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Auth" component={AuthNavigator} />
    <RootStack.Screen name="App" component={AppTabs} />
  </RootStack.Navigator>
);
