import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const Particle = ({ delay }) => {
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const translateY = useRef(new Animated.Value(Math.random() * height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: Math.random() * width,
              duration: 3000 + Math.random() * 2000,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: Math.random() * width,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: Math.random() * height,
              duration: 3000 + Math.random() * 2000,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: Math.random() * height,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.5,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      ).start();
    };

    animate();
  }, [delay, opacity, scale, translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
};

const ColoredBlob = ({ color, delay, size }) => {
  const translateX = useRef(new Animated.Value(Math.random() * width - size / 2)).current;
  const translateY = useRef(new Animated.Value(Math.random() * height - size / 2)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: Math.random() * width - size / 2,
              duration: 4000 + Math.random() * 2000,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: Math.random() * width - size / 2,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: Math.random() * height - size / 2,
              duration: 4000 + Math.random() * 2000,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: Math.random() * height - size / 2,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.2,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.loop(
            Animated.timing(rotate, {
              toValue: 1,
              duration: 8000,
              useNativeDriver: true,
            })
          ),
        ])
      ).start();
    };

    animate();
  }, [delay, rotate, scale, translateX, translateY, size]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }, { rotate: rotation }],
        },
      ]}
    />
  );
};

const AILoadingOverlay = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const particles = Array.from({ length: 30 }, (_, i) => (
    <Particle key={`particle-${i}`} delay={i * 100} />
  ));

  const blobs = [
    { color: 'rgba(99, 102, 241, 0.3)', size: 200, delay: 0 },
    { color: 'rgba(139, 92, 246, 0.3)', size: 250, delay: 500 },
    { color: 'rgba(236, 72, 153, 0.3)', size: 180, delay: 1000 },
    { color: 'rgba(59, 130, 246, 0.3)', size: 220, delay: 1500 },
    { color: 'rgba(168, 85, 247, 0.3)', size: 190, delay: 2000 },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="auto">
      <View style={styles.blobContainer}>
        {blobs.map((blob, i) => (
          <ColoredBlob
            key={`blob-${i}`}
            color={blob.color}
            size={blob.size}
            delay={blob.delay}
          />
        ))}
      </View>
      
      <View style={styles.particleContainer}>
        {particles}
      </View>

      <View style={styles.content}>
        <Text style={styles.loadingText}>✨ AI đang xử lý...</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.6,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
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
