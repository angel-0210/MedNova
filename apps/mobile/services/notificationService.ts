import type * as NotificationsType from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const isExpoGo = Constants.appOwnership === 'expo';

// Importing expo-notifications runs DevicePushTokenAutoRegistration as a side effect, which
// logs an error under Expo Go (SDK 53+ dropped remote push there). Load it on first real use
// so app boot stays clean; a dev build has no such notice.
let notificationsModule: typeof NotificationsType | null = null;

const loadNotifications = async (): Promise<typeof NotificationsType> => {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return notificationsModule;
};

export const notificationService = {
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Expo Push Notifications');
      return;
    }

    // Expo Go does not support remote push notifications starting from SDK 53
    if (isExpoGo) {
      console.warn('Push notifications (remote) are not supported in Expo Go. Use a development build.');
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId)) {
      console.warn('Expo Project ID is missing or is not a valid UUID. Skipping push token registration.');
      return;
    }

    const Notifications = await loadNotifications();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions denied');
      return;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('critical-alerts', {
          name: 'Critical Patient Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF3B30',
        });
      }
      
      return tokenData.data;
    } catch (error) {
      console.warn('Failed to retrieve Expo push token:', error);
      return;
    }
  },

  /** Local notification — works in Expo Go and in dev builds. */
  async showLocalAsync(content: NotificationsType.NotificationContentInput) {
    const Notifications = await loadNotifications();
    return Notifications.scheduleNotificationAsync({ content, trigger: null });
  },

  async addNotificationReceivedListener(callback: (notification: NotificationsType.Notification) => void) {
    const Notifications = await loadNotifications();
    return Notifications.addNotificationReceivedListener(callback);
  },

  async addNotificationResponseReceivedListener(callback: (response: NotificationsType.NotificationResponse) => void) {
    const Notifications = await loadNotifications();
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
