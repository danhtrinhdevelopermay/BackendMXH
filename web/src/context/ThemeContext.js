import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../config/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTheme = async () => {
    try {
      const response = await fetch(`${API_URL}/api/theme/config`);
      const data = await response.json();
      
      if (data.success && data.theme) {
        setTheme(data.theme);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cached_theme', JSON.stringify(data.theme));
        }
        console.log('✨ Theme loaded:', data.theme.name);
      }
    } catch (err) {
      console.error('❌ Error fetching theme:', err);
      setError(err.message);
      
      if (typeof window !== 'undefined') {
        try {
          const cachedTheme = localStorage.getItem('cached_theme');
          if (cachedTheme) {
            setTheme(JSON.parse(cachedTheme));
            console.log('📦 Using cached theme');
          }
        } catch (cacheError) {
          console.error('Error loading cached theme:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();

    const interval = setInterval(() => {
      fetchTheme();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getColor = (colorKey, fallback = '#6200ee') => {
    if (!theme || !theme.colors) return fallback;
    return theme.colors[colorKey] || fallback;
  };

  const isSpecialEvent = () => {
    return theme && theme.event !== null;
  };

  const value = {
    theme,
    isLoading,
    error,
    getColor,
    isSpecialEvent,
    refreshTheme: fetchTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
