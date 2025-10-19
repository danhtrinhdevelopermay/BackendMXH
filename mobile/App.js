import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';
import Constants from 'expo-constants';

let OneSignal;
try {
  OneSignal = require('react-native-onesignal').default;
} catch (e) {
  console.log('OneSignal not available - running in Expo Go or development mode');
}

export default function App() {
  useEffect(() => {
    // Initialize OneSignal only if available (not in Expo Go)
    if (!OneSignal) {
      console.log('OneSignal is not available - push notifications disabled');
      return;
    }

    try {
      const appId = Constants.expoConfig?.extra?.oneSignalAppId;
      if (appId) {
        OneSignal.setAppId(appId);
        
        // Request permission for push notifications
        OneSignal.promptForPushNotificationsWithUserResponse((response) => {
          console.log('OneSignal push permission:', response);
        });

        // Handle notification opened
        OneSignal.setNotificationOpenedHandler((notification) => {
          console.log('OneSignal notification opened:', notification);
          const data = notification.notification.additionalData;
          // You can navigate to specific screens based on data
          // For example: navigation.navigate(data.screen, data.params);
        });

        // Handle notification received (foreground)
        OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
          console.log('OneSignal notification received:', notificationReceivedEvent);
          const notification = notificationReceivedEvent.getNotification();
          // Show notification in foreground
          notificationReceivedEvent.complete(notification);
        });
      }
    } catch (error) {
      console.error('OneSignal initialization error:', error);
    }
  }, []);

  return (
    <ThemeProvider>
      <PaperProvider>
        <AlertProvider>
          <AuthProvider>
            <AppNavigator />
            <CustomAlert />
          </AuthProvider>
        </AlertProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
