import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log('Project ID not found');
        return;
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })
      ).data;

      console.log('Push token:', token);

      const authToken = await SecureStore.getItemAsync('token');
      if (authToken) {
        await axios.post(
          `${API_URL}/api/push-tokens/register`,
          {
            push_token: token,
            device_type: Platform.OS,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        console.log('Push token registered successfully');
      }
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️ Push token registration failed (server error). Notifications may not work until this is fixed.');
      } else if (error.message?.includes('expo-notifications')) {
        console.log('ℹ️ Push notifications are not fully supported in Expo Go. Use a development build for full functionality.');
      } else {
        console.log('⚠️ Could not register push token:', error.message || 'Unknown error');
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function unregisterPushToken(token) {
  try {
    const authToken = await SecureStore.getItemAsync('token');
    if (authToken && token) {
      await axios.post(
        `${API_URL}/api/push-tokens/delete`,
        {
          push_token: token,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log('Push token unregistered successfully');
    }
  } catch (error) {
    console.log('⚠️ Could not unregister push token:', error.message || 'Unknown error');
  }
}

export function setupNotificationListeners(navigation) {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    if (data.screen && navigation) {
      if (data.screen === 'PostDetail' && data.postId) {
        navigation.navigate('PostDetail', { postId: data.postId });
      } else if (data.screen === 'Chat' && data.userId) {
        navigation.navigate('Chat', { userId: data.userId, userName: data.userName });
      } else if (data.screen === 'Notifications') {
        navigation.navigate('Notifications');
      }
    }
  });

  return {
    remove: () => {
      notificationListener.remove();
      responseListener.remove();
    }
  };
}
