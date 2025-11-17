import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated, Dimensions, Easing, TouchableWithoutFeedback, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const IOSStylePopup = ({ 
  visible, 
  onClose, 
  children,
  contentStyle,
  dismissOnBackdropPress = true,
  animationType = 'scale',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const blurIntensity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(blurIntensity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.85,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 30,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(blurIntensity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const animatedBlurIntensity = blurIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 95],
  });

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress && onClose) {
      onClose();
    }
  };

  const getAnimationStyle = () => {
    if (animationType === 'scale') {
      return {
        transform: [{ scale: scaleAnim }],
      };
    } else if (animationType === 'slide') {
      return {
        transform: [{ translateY }],
      };
    } else if (animationType === 'both') {
      return {
        transform: [{ scale: scaleAnim }, { translateY }],
      };
    }
    return {};
  };

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <AnimatedBlurView 
        intensity={animatedBlurIntensity}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.contentContainer,
                  getAnimationStyle(),
                  { opacity: opacityAnim },
                  contentStyle,
                ]}
              >
                {children}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </AnimatedBlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default IOSStylePopup;
