import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const username = email.split('@')[0];
      await register({ username, email, password, full_name: fullName });
    } catch (error) {
      showAlert('Error', error.response?.data?.error || 'Registration failed', 'error');
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

      <ScrollView 
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>
          Chúng tôi ở đây để giúp bạn đạt đến đỉnh cao{'\n'}của việc học. Bạn đã sẵn sàng chưa?
        </Text>

        <TextInput
          placeholder="Nhập tên đầy đủ"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          mode="outlined"
          autoCapitalize="words"
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
          placeholder="Nhập mật khẩu"
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

        <TouchableOpacity style={styles.forgotContainer}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={['#F5C5D8', '#B8A4E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={styles.buttonTouchable}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Đang tải...' : 'Bắt đầu'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#9C7BB0',
    fontWeight: '600',
  },
});

export default RegisterScreen;
