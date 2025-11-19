import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import UpdateModal from './UpdateModal';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
const DEBUG_MODE = __DEV__;

const UpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' || DEBUG_MODE) {
      checkForUpdate();
    }
  }, []);

  const checkForUpdate = async () => {
    try {
      const currentVersionCode = Constants.expoConfig?.android?.versionCode || 1;
      const testVersionCode = DEBUG_MODE ? 1 : currentVersionCode;
      
      console.log(`📱 Checking update for version code: ${testVersionCode} (DEBUG: ${DEBUG_MODE})`);
      
      const response = await fetch(`${API_URL}/api/app-versions/check/${testVersionCode}`);
      const data = await response.json();

      console.log('📦 Update check response:', data);

      if (data.success && data.hasUpdate) {
        console.log('🔄 New update available:', data.update.versionName);
        setUpdateInfo(data.update);
        setShowUpdateModal(true);
      } else {
        console.log('✅ App is up to date');
      }
    } catch (error) {
      console.error('❌ Error checking for update:', error);
    }
  };

  const handleUpdateLater = () => {
    if (updateInfo && !updateInfo.isForceUpdate) {
      setShowUpdateModal(false);
    }
  };

  if (!updateInfo || !showUpdateModal) {
    return null;
  }

  return (
    <UpdateModal
      visible={showUpdateModal}
      updateInfo={updateInfo}
      onUpdateLater={handleUpdateLater}
    />
  );
};

export default UpdateChecker;
