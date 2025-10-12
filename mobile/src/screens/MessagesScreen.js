import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
      console.error('Failed to fetch messages');
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

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    if (days < 7) return `${days} ngày`;
    return date.toLocaleDateString('vi-VN');
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
        activeOpacity={0.7}
      >
        <View style={[styles.conversationCard, isUnread && styles.unreadCard]}>
          <View style={styles.conversationContainer}>
            <View style={styles.avatarContainer}>
              <UserAvatar 
                user={item}
                userId={item.other_user_id}
                size={60}
                style={styles.avatar}
              />
              {isUnread && (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.unreadBadge}
                />
              )}
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.headerRow}>
                <Text style={[styles.userName, isUnread && styles.unreadText]} numberOfLines={1}>
                  {item.full_name || item.username}
                </Text>
                <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text 
                  style={[styles.lastMessage, isUnread && styles.unreadMessageText]} 
                  numberOfLines={1}
                >
                  {item.last_message || 'Bắt đầu cuộc trò chuyện'}
                </Text>
                {isUnread && (
                  <View style={styles.unreadCount}>
                    <Text style={styles.unreadCountText}>•</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="#e4e6eb" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyText}>
              Bắt đầu cuộc trò chuyện với bạn bè của bạn
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  conversationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
  },
  conversationContainer: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#667eea',
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#050505',
  },
  timeText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8e8e93',
    flex: 1,
    lineHeight: 20,
  },
  unreadMessageText: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  unreadCount: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
    marginLeft: 8,
  },
  unreadCountText: {
    fontSize: 10,
    color: '#667eea',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MessagesScreen;
