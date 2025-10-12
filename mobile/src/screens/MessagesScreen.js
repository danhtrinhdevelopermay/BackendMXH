import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Text, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageAPI, thoughtAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import ThoughtsBar from '../components/ThoughtsBar';
import CreateThoughtModal from '../components/CreateThoughtModal';

const MessagesScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserThought, setCurrentUserThought] = useState(null);

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

  const fetchThoughts = async () => {
    if (!user) return;
    
    try {
      const response = await thoughtAPI.getAllThoughts();
      setThoughts(response.data);
      const userThought = response.data.find(t => t.user_id === user.id);
      setCurrentUserThought(userThought || null);
    } catch (error) {
      console.error('Failed to fetch thoughts:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchConversations();
    fetchThoughts();
    const interval = setInterval(() => {
      fetchConversations();
      fetchThoughts();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCreateThought = () => {
    setModalVisible(true);
  };

  const handleSaveThought = async (thoughtData) => {
    try {
      if (thoughtData === null) {
        await thoughtAPI.deleteThought();
        showAlert('Thành công', 'Đã xóa suy nghĩ', 'success');
      } else {
        await thoughtAPI.createOrUpdateThought(thoughtData);
        showAlert('Thành công', 'Đã lưu suy nghĩ', 'success');
      }
      fetchThoughts();
      setModalVisible(false);
    } catch (error) {
      showAlert('Lỗi', 'Không thể lưu suy nghĩ', 'error');
    }
  };

  const renderConversation = React.useCallback(({ item }) => {
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
                user={item}
                userId={item.other_user_id}
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
  }, [navigation]);

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.other_user_id.toString()}
        ListHeaderComponent={
          <ThoughtsBar
            thoughts={thoughts}
            currentUserId={user.id}
            onCreateThought={handleCreateThought}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      <CreateThoughtModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSave={handleSaveThought}
        initialThought={currentUserThought}
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
