import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const StreakIcon = ({ count, size = 'medium' }) => {
  const sizes = {
    small: { icon: 40, text: 10, container: 50 },
    medium: { icon: 50, text: 12, container: 60 },
    large: { icon: 60, text: 14, container: 70 }
  };

  const currentSize = sizes[size];

  if (count === 0) return null;

  return (
    <View 
      style={[
        styles.container,
        { 
          width: currentSize.container,
          height: currentSize.container,
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <Image 
          source={require('../../assets/fire-streak.gif')}
          style={[styles.fireIcon, { width: currentSize.icon, height: currentSize.icon }]}
          resizeMode="contain"
        />
      </View>
      <View style={styles.countBadge}>
        <Text style={[styles.countText, { fontSize: currentSize.text }]} numberOfLines={1}>
          {count}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireIcon: {
    width: 50,
    height: 50,
  },
  countBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default StreakIcon;
