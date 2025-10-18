import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api/api';
import OneSignalService from '../services/OneSignalService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Initialize OneSignal when user is logged in
    if (user?.id) {
      OneSignalService.initialize(user.id);
    }
  }, [user?.id]);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data);
      }
    } catch (error) {
      console.log('Auth check error:', error.message);
      try {
        await SecureStore.deleteItemAsync('token');
      } catch (e) {
        console.log('Error deleting token:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password });
    await SecureStore.setItemAsync('token', response.data.token);
    setUser(response.data.user);
    
    // Initialize OneSignal after login
    if (response.data.user?.id) {
      await OneSignalService.initialize(response.data.user.id);
    }
    
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    await SecureStore.setItemAsync('token', response.data.token);
    setUser(response.data.user);
    
    // Initialize OneSignal after registration
    if (response.data.user?.id) {
      await OneSignalService.initialize(response.data.user.id);
    }
    
    return response.data;
  };

  const logout = async () => {
    // Clear OneSignal user
    await OneSignalService.clearExternalUserId();
    
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.log('Refresh user error:', error.message);
      throw error;
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
