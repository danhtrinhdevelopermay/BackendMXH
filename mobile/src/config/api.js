import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

export default API_URL;
