let OneSignal;
try {
  OneSignal = require('react-native-onesignal').default;
} catch (e) {
  console.log('OneSignal not available - running in Expo Go');
}

import { authAPI } from '../api/api';

class OneSignalService {
  static isAvailable() {
    return OneSignal !== undefined && OneSignal !== null;
  }

  static async initialize(userId) {
    if (!userId || !this.isAvailable()) {
      if (!this.isAvailable()) {
        console.log('OneSignal not available - skipping initialization');
      }
      return;
    }

    try {
      // Set external user ID for OneSignal
      OneSignal.setExternalUserId(userId.toString());
      
      // Get OneSignal player ID
      const deviceState = await OneSignal.getDeviceState();
      const playerId = deviceState?.userId;

      if (playerId) {
        console.log('OneSignal Player ID:', playerId);
        
        // Send player ID to backend
        await authAPI.registerPushToken(playerId);
        console.log('OneSignal Player ID registered with backend');
      }
    } catch (error) {
      console.error('OneSignal initialization error:', error);
    }
  }

  static async clearExternalUserId() {
    if (!this.isAvailable()) return;

    try {
      OneSignal.removeExternalUserId();
    } catch (error) {
      console.error('OneSignal clear user error:', error);
    }
  }

  static setupNotificationHandlers(navigation) {
    if (!this.isAvailable()) {
      console.log('OneSignal not available - skipping notification handlers setup');
      return;
    }

    try {
      // Handle notification opened (user tapped on notification)
      OneSignal.setNotificationOpenedHandler((notification) => {
        console.log('OneSignal notification opened:', notification);
        const data = notification.notification.additionalData;
        
        if (data && navigation) {
          // Navigate based on notification data
          if (data.screen === 'Chat' && data.userId) {
            navigation.navigate('Chat', { 
              userId: data.userId,
              userName: data.userName 
            });
          } else if (data.screen === 'PostDetail' && data.postId) {
            navigation.navigate('PostDetail', { postId: data.postId });
          } else if (data.screen === 'Notifications') {
            navigation.navigate('Notifications');
          }
        }
      });

      // Handle notification received in foreground
      OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
        console.log('OneSignal notification received:', notificationReceivedEvent);
        const notification = notificationReceivedEvent.getNotification();
        
        // Display the notification
        notificationReceivedEvent.complete(notification);
      });
    } catch (error) {
      console.error('OneSignal notification handlers setup error:', error);
    }
  }
}

export default OneSignalService;
