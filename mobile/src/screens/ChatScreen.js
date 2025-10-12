import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { TextInput, IconButton, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { messageAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false
    });
  }, []);

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
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.sender_id === user.id;
    const showTime = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    
    return (
      <View style={styles.messageWrapper}>
        {!isMyMessage && showTime && (
          <View style={styles.theirMessageContainer}>
            <View style={styles.messageRow}>
              <UserAvatar 
                user={{ ...item, id: item.sender_id, avatar_url: userAvatar }} 
                size={36} 
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
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.myBubble}
            >
              <Text style={styles.myText}>{item.content}</Text>
            </LinearGradient>
            <View style={styles.myTimeContainer}>
              <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
              <MaterialCommunityIcons name="check-all" size={16} color="#8B5CF6" style={styles.checkIcon} />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <UserAvatar 
            user={{ id: userId, avatar_url: userAvatar, username: userName }} 
            size={42}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call-outline" size={24} color="#6B7280" />
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
        
        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type here..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              multiline
            />
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="happy-outline" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="camera-outline" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {newMessage.trim() && (
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={loading}
              style={styles.sendButton}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color="#fff" />
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 48 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginVertical: 4,
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
    width: 36,
    marginRight: 8,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '75%',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  theirText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  myText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 44,
  },
  myTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginRight: 4,
  },
  checkIcon: {
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  sendButton: {
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
