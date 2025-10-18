import React, { createContext, useState, useEffect } from 'react';
import { getItem, setItem, deleteItem } from '../utils/storage';
import { authAPI } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getItem('token');
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data);
      }
    } catch (error) {
      console.log('Auth check error:', error.message);
      try {
        await deleteItem('token');
      } catch (e) {
        console.log('Error deleting token:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password });
    await setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    await setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await deleteItem('token');
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
