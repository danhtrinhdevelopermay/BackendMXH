import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Text, Card } from 'react-native-paper';
import { messageAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';

const MessagesScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to fetch conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderConversation = ({ item }) => {
    const isUnread = !item.is_read && item.sender_id !== item.other_user_id;
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Chat', { 
          userId: item.other_user_id, 
          userName: item.full_name || item.username,
          userAvatar: item.avatar_url
        })}
      >
        <Card style={[styles.conversationCard, isUnread && styles.unreadCard]} elevation={0}>
          <View style={styles.conversationContainer}>
            <View style={styles.avatarContainer}>
              <UserAvatar 
                user={{ ...item, id: item.other_user_id }}
                size={56}
                style={styles.avatar}
              />
              {isUnread && <View style={styles.unreadBadge} />}
            </View>
            <View style={styles.conversationInfo}>
              <Text style={[styles.userName, isUnread && styles.unreadText]}>
                {item.full_name || item.username}
              </Text>
              <Text 
                style={[styles.lastMessage, isUnread && styles.unreadText]} 
                numberOfLines={1}
              >
                {item.last_message || 'No messages yet'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.other_user_id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginBottom: 1,
    borderRadius: 0,
  },
  unreadCard: {
    backgroundColor: '#f0f8ff',
  },
  conversationContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#1877f2',
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1877f2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#050505',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#65676b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default MessagesScreen;
