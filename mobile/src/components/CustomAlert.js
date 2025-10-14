import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAlert } from '../context/AlertContext';

const { width } = Dimensions.get('window');

const CustomAlert = () => {
  const { alert, hideAlert } = useAlert();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alert.visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [alert.visible]);

  const getIconConfig = () => {
    switch (alert.type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#4caf50' };
      case 'error':
        return { name: 'close-circle', color: '#f44336' };
      case 'warning':
        return { name: 'warning', color: '#ff9800' };
      default:
        return { name: 'information-circle', color: '#2196f3' };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (onPress) => {
    hideAlert();
    if (onPress) {
      setTimeout(() => onPress(), 100);
    }
  };

  return (
    <Modal
      transparent
      visible={alert.visible}
      animationType="none"
      onRequestClose={hideAlert}
    >
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <Animated.View style={{ opacity: opacityAnim }}>
          <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={iconConfig.name} size={60} color={iconConfig.color} />
          </View>

          {alert.title ? (
            <Text style={styles.title}>{alert.title}</Text>
          ) : null}

          {alert.message ? (
            <Text style={styles.message}>{alert.message}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            {alert.buttons.map((button, index) => (
              <Button
                key={index}
                mode={button.style === 'cancel' ? 'outlined' : 'contained'}
                onPress={() => handleButtonPress(button.onPress)}
                style={[
                  styles.button,
                  alert.buttons.length > 1 && index < alert.buttons.length - 1 && styles.buttonMargin,
                ]}
                buttonColor={
                  button.style === 'destructive'
                    ? '#f44336'
                    : button.style === 'cancel'
                    ? 'transparent'
                    : '#1877f2'
                }
                textColor={
                  button.style === 'cancel'
                    ? '#1877f2'
                    : '#fff'
                }
              >
                {button.text}
              </Button>
            ))}
          </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    borderRadius: 10,
  },
  buttonMargin: {
    marginRight: 8,
  },
});

export default CustomAlert;
