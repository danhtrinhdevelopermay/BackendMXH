import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#E8D5F2', '#F5C5D8', '#E8D5F2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Chào mừng</Text>
        <Text style={styles.greeting}>Xin chào</Text>
        <Text style={styles.subtitle}>
          Hãy tham mạng xã hội này {'\n'}
          Trước tiên hãy đăng nhập hoặc đăng ký 
        </Text>

        <Image
          source={require('../../assets/logo.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Register')}
            style={styles.createButton}
            buttonColor="#FFFFFF"
            textColor="#000000"
            labelStyle={styles.buttonLabel}
          >
            Tạo tài khoản mới
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
            textColor="#FFFFFF"
            theme={{ colors: { outline: '#FFFFFF' }}}
            labelStyle={styles.buttonLabel}
          >
            Đăng nhập
          </Button>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  illustration: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  createButton: {
    borderRadius: 25,
    paddingVertical: 4,
  },
  loginButton: {
    borderRadius: 25,
    borderWidth: 2,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
