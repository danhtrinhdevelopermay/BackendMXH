import { Platform } from 'react-native';

let SecureStore = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.log('expo-secure-store not available');
  }
}

export const setItem = async (key, value) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  } else if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getItem = async (key) => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  } else if (SecureStore) {
    return await SecureStore.getItemAsync(key);
  }
  return null;
};

export const deleteItem = async (key) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  } else if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  }
};
