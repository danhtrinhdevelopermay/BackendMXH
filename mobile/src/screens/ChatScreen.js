import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Text, Avatar } from 'react-native-paper';
import { messageAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: userName });
  }, [userName]);

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

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <Avatar.Text size={30} label={item.sender_username?.[0]?.toUpperCase() || 'U'} />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          <Text style={isMyMessage ? styles.myText : styles.theirText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        inverted
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={styles.input}
          mode="outlined"
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSend}
          disabled={loading || !newMessage.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  myBubble: {
    backgroundColor: '#1877f2',
  },
  theirBubble: {
    backgroundColor: '#e4e6eb',
  },
  myText: {
    color: '#fff',
  },
  theirText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
});

export default ChatScreen;
