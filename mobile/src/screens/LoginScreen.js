import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput, Button, Text, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      showAlert('Error', error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8D5F2', '#F5C5D8']}
        style={styles.gradientTop}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>
          Bạn đã sẵn sàng tiếp tục hành trình học tập của mình chưa?{'\n'}Đường đi của bạn ở ngay đây.
        </Text>

        <TextInput
          placeholder="Nhập email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          outlineColor="transparent"
          activeOutlineColor="transparent"
          theme={{ 
            colors: { 
              background: '#F5F5F5',
            },
            roundness: 12,
          }}
        />

        <TextInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry={!showPassword}
          outlineColor="transparent"
          activeOutlineColor="transparent"
          theme={{ 
            colors: { 
              background: '#F5F5F5',
            },
            roundness: 12,
          }}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off-outline" : "eye-outline"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <View style={styles.optionsRow}>
          <View style={styles.rememberContainer}>
            <Checkbox
              status={rememberMe ? 'checked' : 'unchecked'}
              onPress={() => setRememberMe(!rememberMe)}
              color="#9C7BB0"
            />
            <Text style={styles.rememberText}>Nhớ tôi nhé</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#F5C5D8', '#B8A4E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={styles.buttonTouchable}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Đang tải...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Bạn chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientTop: {
    height: height * 0.25,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
    marginLeft: -8,
  },
  forgotText: {
    fontSize: 14,
    color: '#9C7BB0',
    fontWeight: '500',
  },
  gradientButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonTouchable: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#9C7BB0',
    fontWeight: '600',
  },
});

export default LoginScreen;
