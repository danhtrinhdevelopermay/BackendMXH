import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';

export default function App() {
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
