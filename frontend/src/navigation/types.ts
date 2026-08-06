import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  LiveMonitoring: { patientId: string };
  AIPredictions: { patientId: string };
  AlertDetails: { alertId: string };
};

export type PatientStackParamList = {
  PatientListHome: undefined;
  PatientDetails: { patientId: string };
  LiveMonitoring: { patientId: string };
};

export type AlertsStackParamList = {
  AlertsHome: undefined;
  AlertDetails: { alertId: string };
};

export type ReportsStackParamList = {
  ReportsHome: undefined;
  ReportViewer: { reportId: string };
};

export type DeviceStackParamList = {
  DeviceHome: undefined;
  BLEPairing: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  Help: undefined;
  About: undefined;
};

export type AppTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Patients: NavigatorScreenParams<PatientStackParamList>;
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
  Reports: NavigatorScreenParams<ReportsStackParamList>;
  Devices: NavigatorScreenParams<DeviceStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};
