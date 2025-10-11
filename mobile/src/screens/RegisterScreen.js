import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await register({ username, email, password, full_name: fullName });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Create Account</Title>
      <TextInput
        label="Username *"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
        autoCapitalize="none"
      />
      <TextInput
        label="Email *"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Password *"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
        secureTextEntry
      />
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Register
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.loginButton}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1877f2',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  loginButton: {
    marginTop: 10,
  },
});

export default RegisterScreen;
