import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web platform');
    return null;
  }
  return null;
}

export async function unregisterPushToken(token) {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web platform');
    return;
  }
}

export function setupNotificationListeners(navigation) {
  return {
    remove: () => {
      console.log('Notification listeners cleaned up (web)');
    }
  };
}
