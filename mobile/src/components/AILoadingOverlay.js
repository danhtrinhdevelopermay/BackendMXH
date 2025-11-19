import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const AnimatedOrb = () => {
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotate1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate2, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const rotation1 = rotate1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotation2 = rotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.orbContainer}>
      <Animated.View
        style={[
          styles.orbLayer,
          {
            transform: [{ scale }, { rotate: rotation1 }],
          },
        ]}
      >
        <View style={[styles.gradientBlob, { backgroundColor: '#6366f1' }]} />
        <View style={[styles.gradientBlob, { backgroundColor: '#8b5cf6', left: 60, top: 40 }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.orbLayer,
          {
            transform: [{ scale }, { rotate: rotation2 }],
          },
        ]}
      >
        <View style={[styles.gradientBlob, { backgroundColor: '#ec4899', left: 40, top: 60 }]} />
        <View style={[styles.gradientBlob, { backgroundColor: '#3b82f6', left: 80, top: 20 }]} />
      </Animated.View>
    </View>
  );
};

const AILoadingOverlay = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blurIntensity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(blurIntensity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(blurIntensity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, blurIntensity]);

  if (!visible) return null;

  const animatedBlurIntensity = blurIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 95],
  });

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <AnimatedBlurView
        intensity={animatedBlurIntensity}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.overlay}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <BlurView intensity={80} tint="light" style={styles.orbBlur}>
            <AnimatedOrb />
          </BlurView>

          <View style={styles.content}>
            <Text style={styles.loadingText}>✨ AI đang xử lý...</Text>
          </View>
        </Animated.View>
      </AnimatedBlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbBlur: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    marginBottom: 40,
  },
  orbContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientBlob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.7,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default AILoadingOverlay;
