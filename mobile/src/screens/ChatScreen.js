import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, Animated, Modal, Pressable, Image, Alert } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { messageAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import SocketService from '../services/SocketService';
import { useAlert } from '../context/AlertContext';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const typingTimeoutRef = useRef(null);

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
    
    const socket = SocketService.getSocket();
    if (socket) {
      socket.on('user_typing', (data) => {
        if (data.userId === userId) {
          setIsTyping(true);
        }
      });
      
      socket.on('user_stop_typing', (data) => {
        if (data.userId === userId) {
          setIsTyping(false);
        }
      });
    }
    
    return () => {
      if (socket) {
        socket.off('user_typing');
        socket.off('user_stop_typing');
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user.id, userId]);

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

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

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

  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setShowReactions(true);
  };

  const handleReaction = async (reaction) => {
    if (!selectedMessage) return;
    
    try {
      console.log('Adding reaction to message:', selectedMessage.id, reaction);
      showAlert('Thành công', 'Đã thêm cảm xúc', 'success');
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setShowReactions(false);
      setSelectedMessage(null);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        showAlert('Thông báo', 'Tính năng gửi ảnh sẽ được cập nhật trong phiên bản sau', 'info');
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleTyping = (text) => {
    setNewMessage(text);
    
    const socket = SocketService.getSocket();
    if (socket) {
      socket.emit('typing', { userId: user.id, receiverId: userId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { userId: user.id, receiverId: userId });
      }, 1000);
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

  const reactions = [
    { icon: '👍', name: 'like' },
    { icon: '❤️', name: 'love' },
    { icon: '😆', name: 'haha' },
    { icon: '😮', name: 'wow' },
    { icon: '😢', name: 'sad' },
    { icon: '😡', name: 'angry' },
  ];

  const renderMessage = React.useCallback(({ item, index }) => {
    const isMyMessage = item.sender_id === user.id;
    const showTime = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    const showDateSep = shouldShowDateSeparator(index);
    
    return (
      <View>
        <View style={styles.messageWrapper}>
          {!isMyMessage && (
            <View style={styles.theirMessageContainer}>
              <View style={styles.messageRow}>
                {showTime && (
                  <UserAvatar 
                    user={otherUser}
                    size={28} 
                    style={styles.messageAvatar}
                  />
                )}
                {!showTime && <View style={styles.avatarPlaceholder} />}
                <Pressable 
                  onLongPress={() => handleLongPress(item)}
                  delayLongPress={300}
                >
                  <View style={styles.theirBubble}>
                    <Text style={styles.theirText}>{item.content}</Text>
                  </View>
                  {item.reaction && (
                    <View style={styles.reactionBadge}>
                      <Text style={styles.reactionText}>{item.reaction}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
              {showTime && (
                <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
              )}
            </View>
          )}

          {isMyMessage && (
            <View style={styles.myMessageContainer}>
              <Pressable 
                onLongPress={() => handleLongPress(item)}
                delayLongPress={300}
              >
                <View style={styles.myBubble}>
                  <Text style={styles.myText}>{item.content}</Text>
                </View>
                {item.reaction && (
                  <View style={styles.myReactionBadge}>
                    <Text style={styles.reactionText}>{item.reaction}</Text>
                  </View>
                )}
              </Pressable>
              {showTime && (
                <View style={styles.myTimeContainer}>
                  <Text style={styles.myTimeText}>{formatTime(item.created_at)}</Text>
                  {item.is_read ? (
                    <MaterialCommunityIcons name="check-all" size={12} color="#0084FF" style={styles.checkIcon} />
                  ) : (
                    <MaterialCommunityIcons name="check" size={12} color="#65676B" style={styles.checkIcon} />
                  )}
                </View>
              )}
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
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#050505" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            <UserAvatar 
              user={otherUser} 
              size={36}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleVoiceCall}>
            <Ionicons name="call" size={22} color="#0084FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam" size={24} color="#0084FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowInfoModal(true)}>
            <Ionicons name="information-circle-outline" size={24} color="#0084FF" />
          </TouchableOpacity>
        </View>
      </View>

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

        {isTyping && (
          <View style={styles.typingContainer}>
            <UserAvatar user={otherUser} size={20} />
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
            </View>
          </View>
        )}
        
        <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={styles.inputIconButton}>
            <Ionicons name="add-circle" size={32} color="#0084FF" />
          </TouchableOpacity>
          
          <View style={styles.inputContainerOuter}>
            <View style={styles.inputContainer}>
              <TextInput
                value={newMessage}
                onChangeText={handleTyping}
                placeholder="Aa"
                placeholderTextColor="#BCC0C4"
                style={styles.input}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                multiline
              />
              <TouchableOpacity style={styles.inputIcon}>
                <Ionicons name="happy-outline" size={22} color="#0084FF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {newMessage.trim() ? (
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={loading}
              style={styles.sendIconButton}
            >
              <Ionicons name="send" size={20} color="#0084FF" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.inputIconButton}>
                <Ionicons name="mic" size={24} color="#0084FF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputIconButton} onPress={pickImage}>
                <Ionicons name="image" size={24} color="#0084FF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputIconButton}>
                <MaterialCommunityIcons name="sticker-emoji" size={24} color="#0084FF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showReactions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowReactions(false)}
        >
          <View style={styles.reactionsContainer}>
            {reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.name}
                style={styles.reactionButton}
                onPress={() => handleReaction(reaction.icon)}
              >
                <Text style={styles.reactionIcon}>{reaction.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <Pressable 
          style={styles.infoModalOverlay}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={styles.infoModalContent}>
            <View style={styles.infoHeader}>
              <UserAvatar user={otherUser} size={80} />
              <Text style={styles.infoName}>{userName}</Text>
            </View>
            
            <View style={styles.infoActions}>
              <TouchableOpacity 
                style={styles.infoActionButton}
                onPress={() => {
                  setShowInfoModal(false);
                  navigation.navigate('Profile', { userId });
                }}
              >
                <Ionicons name="person-outline" size={24} color="#0084FF" />
                <Text style={styles.infoActionText}>Xem trang cá nhân</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.infoActionButton}
                onPress={() => {
                  setShowInfoModal(false);
                  handleVoiceCall();
                }}
              >
                <Ionicons name="call-outline" size={24} color="#0084FF" />
                <Text style={styles.infoActionText}>Gọi điện</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.infoCloseButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'android' ? 44 : 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 6,
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
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerText: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  headerStatus: {
    fontSize: 12,
    color: '#65676B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginVertical: 1,
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
    marginRight: 6,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: 6,
  },
  theirBubble: {
    backgroundColor: '#E4E6EB',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  myBubble: {
    backgroundColor: '#0084FF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  theirText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
  },
  myText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    color: '#65676B',
    marginTop: 2,
    marginLeft: 40,
  },
  myTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 2,
  },
  myTimeText: {
    fontSize: 11,
    color: '#65676B',
  },
  checkIcon: {
    marginLeft: 3,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  myReactionBadge: {
    position: 'absolute',
    bottom: -8,
    left: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  reactionText: {
    fontSize: 12,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  dateLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#E4E6EB',
  },
  dateText: {
    fontSize: 12,
    color: '#65676B',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#E4E6EB',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 6,
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#65676B',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E6EB',
    paddingHorizontal: 8,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  inputContainerOuter: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    maxHeight: 100,
  },
  inputIcon: {
    padding: 4,
    marginLeft: 4,
  },
  inputIconButton: {
    padding: 4,
  },
  sendIconButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  reactionButton: {
    padding: 6,
  },
  reactionIcon: {
    fontSize: 28,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  infoModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    minHeight: 300,
  },
  infoHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#050505',
    marginTop: 12,
  },
  infoActions: {
    gap: 12,
    marginBottom: 20,
  },
  infoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoActionText: {
    fontSize: 16,
    color: '#050505',
    fontWeight: '500',
  },
  infoCloseButton: {
    backgroundColor: '#E4E6EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#65676B',
  },
});

export default ChatScreen;
