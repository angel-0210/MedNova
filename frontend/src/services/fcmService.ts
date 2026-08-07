import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { useAlertStore } from '../stores';

export const fcmService = {
  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('FCM Notification permission granted:', authStatus);
      await this.getFcmToken();
    }
  },

  async getFcmToken() {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Device Token:', fcmToken);
        // Normally, you would post this token to backend: await authRepository.saveFcmToken(fcmToken);
      }
    } catch (error) {
      console.error('Failed to get FCM Device Token:', error);
    }
  },

  registerListeners() {
    // 1. Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM Foreground message received:', remoteMessage);
      
      const { notification } = remoteMessage;
      if (notification) {
        Alert.alert(
          notification.title || 'MedNova Alert',
          notification.body || 'New alert event triggered',
          [
            {
              text: 'View Details',
              onPress: () => {
                // Fetch alerts to update store or trigger navigation
                useAlertStore.getState().fetchActiveAlerts();
              },
            },
            { text: 'Dismiss', style: 'cancel' },
          ]
        );
      }
    });

    // 2. Handle background/quit messages opening the app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App opened by FCM notification from background:', remoteMessage);
      // Here you would navigate to navigation.navigate('Alerts') or similar
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened by FCM notification from quit state:', remoteMessage);
        }
      });
  },
};
