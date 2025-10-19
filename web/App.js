import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';
import CustomAlert from './src/components/CustomAlert';

export default function App() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
      const url = window.location.origin;
      const interval = 14 * 60 * 1000;

      console.log('🔄 Render Anti-Spindown activated for Web App');
      console.log(`📡 Pinging: ${url} every 14 minutes`);

      function keepAlive() {
        fetch(url, { method: 'HEAD' })
          .then(() => {
            console.log(`✅ Keep-alive ping successful at ${new Date().toISOString()}`);
          })
          .catch(error => {
            console.error(`❌ Keep-alive error at ${new Date().toISOString()}:`, error.message);
          });
      }

      const keepAliveInterval = setInterval(keepAlive, interval);

      setTimeout(keepAlive, 5000);

      return () => clearInterval(keepAliveInterval);
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
