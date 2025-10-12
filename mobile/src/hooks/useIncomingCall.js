import { useState, useEffect, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import SocketService from '../services/SocketService';
import { AuthContext } from '../context/AuthContext';

export const useIncomingCall = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user) return;

    const socket = SocketService.connect(user.id);

    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [user]);

  const acceptCall = () => {
    if (incomingCall) {
      const socket = SocketService.getSocket();
      if (socket) {
        socket.emit('accept_call', {
          callerId: incomingCall.callerId,
          receiverId: user.id
        });

        navigation.navigate('VoiceCall', {
          callType: 'incoming',
          otherUser: {
            id: incomingCall.callerId,
            username: incomingCall.callerName,
            full_name: incomingCall.callerName
          },
          socket
        });
      }
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      const socket = SocketService.getSocket();
      if (socket) {
        socket.emit('reject_call', {
          callerId: incomingCall.callerId
        });
      }
      setIncomingCall(null);
    }
  };

  return {
    incomingCall,
    acceptCall,
    rejectCall
  };
};
