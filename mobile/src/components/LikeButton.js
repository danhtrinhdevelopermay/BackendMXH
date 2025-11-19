import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';

const LikeButton = ({ isLiked, reactionType, onPress, onLongPress, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatingHeartAnim = useRef(new Animated.Value(0)).current;
  const floatingOpacity = useRef(new Animated.Value(0)).current;

  const getReactionIcon = (type) => {
    const icons = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡'
    };
    return icons[type] || '👍';
  };

  const getReactionText = (type) => {
    const texts = {
      like: 'Thích',
      love: 'Yêu thích',
      haha: 'Haha',
      wow: 'Wow',
      sad: 'Buồn',
      angry: 'Phẫn nộ'
    };
    return texts[type] || 'Thích';
  };

  useEffect(() => {
    if (isLiked) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.parallel([
        Animated.timing(floatingHeartAnim, {
          toValue: -40,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(floatingOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(floatingOpacity, {
            toValue: 0,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        floatingHeartAnim.setValue(0);
        floatingOpacity.setValue(0);
      });
    }
  }, [isLiked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.9}
    >
      <View style={styles.buttonContent}>
        {isLiked ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.actionGradient}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Text style={styles.actionIconEmoji}>{getReactionIcon(reactionType)}</Text>
            </Animated.View>
            <Text style={styles.actionTextActive}>
              {getReactionText(reactionType)}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.actionNormal}>
            <Ionicons name="heart-outline" size={22} color="#6b7280" />
            <Text style={styles.actionText}>Thích</Text>
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.floatingHeart,
          {
            opacity: floatingOpacity,
            transform: [{ translateY: floatingHeartAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.floatingHeartIcon}>{getReactionIcon(reactionType || 'like')}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  buttonContent: {
    width: '100%',
    alignItems: 'center',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  actionNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  actionIconEmoji: {
    fontSize: 18,
  },
  actionTextActive: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  actionText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  floatingHeart: {
    position: 'absolute',
    top: -10,
  },
  floatingHeartIcon: {
    fontSize: 32,
  },
});

export default LikeButton;
