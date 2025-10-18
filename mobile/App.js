import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';

export default function App() {
  useEffect(() => {
    // Initialize OneSignal
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
  }, []);

  return (
    <PaperProvider>
      <AlertProvider>
        <AuthProvider>
          <AppNavigator />
          <CustomAlert />
        </AuthProvider>
      </AlertProvider>
    </PaperProvider>
  );
}
