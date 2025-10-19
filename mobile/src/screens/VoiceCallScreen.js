import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UserAvatar from '../components/UserAvatar';
import { AuthContext } from '../context/AuthContext';
import WebRTCService from '../services/WebRTCService';

const VoiceCallScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { callType, otherUser, socket } = route.params;
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callStatus, setCallStatus] = useState(callType === 'outgoing' ? 'Calling...' : 'Incoming call');
  const [pulseAnim] = useState(new Animated.Value(1));
  const timerRef = React.useRef(null);
  const webrtcInitialized = React.useRef(false);

  useEffect(() => {
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

    if (socket) {
      socket.on('call_accepted', async () => {
        setCallStatus('Connected');
        startCallTimer();
        
        if (!webrtcInitialized.current) {
          try {
            await initializeWebRTC(callType === 'outgoing');
            webrtcInitialized.current = true;
          } catch (error) {
            console.error('Failed to initialize WebRTC:', error);
            Alert.alert('Error', 'Failed to start audio call');
            handleEndCall();
          }
        }
      });

      socket.on('call_rejected', () => {
        setCallStatus('Call declined');
        setTimeout(() => navigation.goBack(), 2000);
      });

      socket.on('call_ended', () => {
        setCallStatus('Call ended');
        cleanupCall();
        setTimeout(() => navigation.goBack(), 1000);
      });

      socket.on('user_offline', () => {
        setCallStatus('User is offline');
        setTimeout(() => navigation.goBack(), 2000);
      });
    }

    return () => {
      cleanupCall();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (socket) {
        socket.off('call_accepted');
        socket.off('call_rejected');
        socket.off('call_ended');
        socket.off('user_offline');
      }
    };
  }, [socket]);

  const initializeWebRTC = async (isInitiator) => {
    try {
      await WebRTCService.initializeCall(socket, isInitiator);
      
      if (isInitiator) {
        await WebRTCService.startCall();
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  };

  const startCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanupCall = async () => {
    try {
      await WebRTCService.endCall();
      webrtcInitialized.current = false;
    } catch (error) {
      console.error('Error cleaning up call:', error);
    }
  };

  const handleEndCall = async () => {
    if (socket) {
      socket.emit('end_call', {
        userId: user.id,
        otherUserId: otherUser.id
      });
    }
    await cleanupCall();
    navigation.goBack();
  };

  const handleAcceptCall = async () => {
    if (socket && callType === 'incoming') {
      socket.emit('accept_call', {
        callerId: otherUser.id,
        receiverId: user.id
      });
      setCallStatus('Connected');
      startCallTimer();
      
      try {
        await initializeWebRTC(false);
        webrtcInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        Alert.alert('Error', 'Failed to start audio call');
        handleEndCall();
      }
    }
  };

  const handleRejectCall = () => {
    if (socket) {
      socket.emit('reject_call', {
        callerId: otherUser.id
      });
    }
    navigation.goBack();
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    WebRTCService.toggleMute(newMutedState);
  };

  const handleToggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    WebRTCService.toggleSpeaker(newSpeakerState);
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.status}>{callStatus}</Text>
        
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <UserAvatar
            user={otherUser}
            size={120}
            style={styles.avatar}
          />
        </Animated.View>

        <Text style={styles.name}>{otherUser.username || otherUser.full_name || 'Unknown'}</Text>
        
        {callDuration > 0 && (
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.activeControl]}
            onPress={handleToggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.activeControl]}
            onPress={handleToggleSpeaker}
          >
            <MaterialCommunityIcons
              name={isSpeakerOn ? 'volume-high' : 'volume-off'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          {callType === 'incoming' && callStatus === 'Incoming call' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptCall}
              >
                <Ionicons name="call" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectCall}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {(callType === 'outgoing' || callStatus === 'Connected') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={32} color="#fff" />
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 24,
  },
  status: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 24,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    borderRadius: 60,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  duration: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 60,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 60,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
});

export default VoiceCallScreen;
