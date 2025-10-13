import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import SocketService from '../services/SocketService';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const otherUser = React.useMemo(() => ({
    id: userId,
    avatar_url: userAvatar,
    username: userName
  }), [userId, userAvatar, userName]);

  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false
    });

    SocketService.connect(user.id);
  }, [user.id]);

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getMessages(userId);
      setMessages(response.data.reverse());
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await messageAPI.sendMessage({ receiver_id: userId, content: newMessage });
      setNewMessage('');
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCall = () => {
    const socket = SocketService.getSocket();
    if (socket) {
      socket.emit('call_user', {
        callerId: user.id,
        callerName: user.full_name || user.username,
        receiverId: userId
      });

      navigation.navigate('VoiceCall', {
        callType: 'outgoing',
        otherUser,
        socket
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentIndex) => {
    if (currentIndex === messages.length - 1) return true;
    
    const currentDate = new Date(messages[currentIndex].created_at).toDateString();
    const nextDate = new Date(messages[currentIndex + 1].created_at).toDateString();
    
    return currentDate !== nextDate;
  };

  const renderMessage = React.useCallback(({ item, index }) => {
    const isMyMessage = item.sender_id === user.id;
    const showTime = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    const showDateSep = shouldShowDateSeparator(index);
    
    return (
      <View>
        <View style={styles.messageWrapper}>
          {!isMyMessage && showTime && (
            <View style={styles.theirMessageContainer}>
              <View style={styles.messageRow}>
                <UserAvatar 
                  user={otherUser}
                  size={34} 
                  style={styles.messageAvatar}
                />
                <View style={styles.theirBubble}>
                  <Text style={styles.theirText}>{item.content}</Text>
                </View>
              </View>
              <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
            </View>
          )}
          
          {!isMyMessage && !showTime && (
            <View style={styles.theirMessageContainer}>
              <View style={styles.messageRow}>
                <View style={styles.avatarPlaceholder} />
                <View style={styles.theirBubble}>
                  <Text style={styles.theirText}>{item.content}</Text>
                </View>
              </View>
            </View>
          )}

          {isMyMessage && (
            <View style={styles.myMessageContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.myBubble}
              >
                <Text style={styles.myText}>{item.content}</Text>
              </LinearGradient>
              <View style={styles.myTimeContainer}>
                <Text style={styles.myTimeText}>{formatTime(item.created_at)}</Text>
                {item.is_read ? (
                  <MaterialCommunityIcons name="check-all" size={14} color="#667eea" style={styles.checkIcon} />
                ) : (
                  <MaterialCommunityIcons name="check" size={14} color="#9CA3AF" style={styles.checkIcon} />
                )}
              </View>
            </View>
          )}
        </View>

        {showDateSep && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
      </View>
    );
  }, [user.id, messages, otherUser]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <LinearGradient
        colors={['#fff', '#f8f9fa']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            <UserAvatar 
              user={otherUser} 
              size={40}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>đang hoạt động</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleVoiceCall}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.callButton}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputContainerOuter}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputGradientBorder}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  multiline
                />
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="happy-outline" size={22} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIcon}>
                  <Ionicons name="image-outline" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
          
          {newMessage.trim() && (
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={loading}
              style={styles.sendButton}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'android' ? 48 : 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerText: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 1,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageWrapper: {
    marginVertical: 3,
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageAvatar: {
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 34,
    marginRight: 8,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  myBubble: {
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  theirText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 21,
  },
  myText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
    fontWeight: '400',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 42,
    fontWeight: '400',
  },
  myTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginRight: 2,
  },
  myTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  checkIcon: {
    marginLeft: 4,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputContainerOuter: {
    flex: 1,
  },
  inputGradientBorder: {
    borderRadius: 26,
    padding: 1.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    maxHeight: 100,
  },
  inputIcon: {
    padding: 6,
    marginLeft: 4,
  },
  sendButton: {
    marginLeft: 10,
    marginBottom: 2,
  },
  sendButtonGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default ChatScreen;
