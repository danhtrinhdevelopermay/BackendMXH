import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const StreakIcon = ({ count, size = 'medium' }) => {
  const sizes = {
    small: { icon: 24, text: 10, container: 32 },
    medium: { icon: 28, text: 11, container: 36 },
    large: { icon: 32, text: 12, container: 40 }
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
    marginLeft: -6,
    marginBottom: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireIcon: {
    width: 28,
    height: 28,
  },
  countBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00000000',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  countText: {
    color: '#d77900',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StreakIcon;
