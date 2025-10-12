import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserAvatar from './UserAvatar';

const IncomingCallModal = ({ visible, caller, onAccept, onReject }) => {
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [visible]);

  if (!caller) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.incomingText}>Cuộc gọi thoại đến</Text>
          
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <UserAvatar
              user={caller}
              size={100}
              style={styles.avatar}
            />
          </Animated.View>

          <Text style={styles.callerName}>
            {caller.callerName || caller.username || caller.full_name || 'Unknown'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <Ionicons name="close" size={32} color="#fff" />
              <Text style={styles.actionText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons name="call" size={32} color="#fff" />
              <Text style={styles.actionText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  incomingText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 40,
    fontWeight: '500',
  },
  avatarContainer: {
    marginBottom: 24,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    borderRadius: 50,
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 60,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default IncomingCallModal;
