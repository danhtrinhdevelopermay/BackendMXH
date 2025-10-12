import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Chào mừng đến với</Text>
          <Text style={styles.appName}>Social Connect</Text>
          <Text style={styles.subtitle}>
            Kết nối với bạn bè và chia sẻ những khoảnh khắc đáng nhớ
          </Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.createButton}
            >
              <Text style={styles.createButtonText}>Tạo tài khoản mới</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  illustration: {
    width: width * 0.5,
    height: width * 0.5,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  createButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 0.5,
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;
