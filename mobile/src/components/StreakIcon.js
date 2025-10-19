import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StreakIcon = ({ count, size = 'medium' }) => {
  const sizes = {
    small: { icon: 16, text: 12, container: 24 },
    medium: { icon: 20, text: 14, container: 28 },
    large: { icon: 24, text: 16, container: 32 }
  };

  const currentSize = sizes[size];

  if (count === 0) return null;

  return (
    <View 
      style={[
        styles.container,
        { 
          height: currentSize.container,
        }
      ]}
    >
      <LinearGradient
        colors={['#FF6B00', '#FF8C00', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: currentSize.container / 2 }]}
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.fireIcon, { fontSize: currentSize.icon }]}>🔥</Text>
        </View>
      </LinearGradient>
      <View style={[styles.countBadge, { minWidth: currentSize.container }]}>
        <Text style={[styles.countText, { fontSize: currentSize.text }]} numberOfLines={1}>
          {count}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  gradient: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  countBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: -8,
    minWidth: 28,
    height: 20,
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
    fontSize: 14,
    textAlign: 'center',
  },
});

export default StreakIcon;
