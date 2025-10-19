import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const EventBanner = () => {
  const { theme, isSpecialEvent } = useTheme();

  if (!isSpecialEvent() || !theme || !theme.event) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primaryLight || '#ff69b4' }]}>
      <Text style={styles.greeting}>{theme.event.greeting}</Text>
      <Text style={styles.message}>{theme.event.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default EventBanner;
