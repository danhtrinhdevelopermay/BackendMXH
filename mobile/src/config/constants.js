import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export const getWebRTCStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/api/webrtc-status`);
    const data = await response.json();
    return data.enabled;
  } catch (error) {
    console.error('Error checking WebRTC status:', error);
    return false;
  }
};
