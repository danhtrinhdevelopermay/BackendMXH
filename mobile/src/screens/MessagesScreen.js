import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
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
  const [searchQuery, setSearchQuery] = useState('');

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
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter(item => {
    const name = (item.full_name || item.username || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

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
        <View style={styles.conversationItem}>
          <View style={styles.avatarWrapper}>
            <UserAvatar 
              user={item}
              userId={item.other_user_id}
              size={56}
            />
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.conversationContent}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, isUnread && styles.unreadName]} numberOfLines={1}>
                {item.full_name || item.username}
              </Text>
              <Text style={styles.timeText}>{formatTime(item.last_message_time)}</Text>
            </View>
            <Text 
              style={[styles.lastMessage, isUnread && styles.unreadMessage]} 
              numberOfLines={2}
            >
              {item.last_message || 'Bắt đầu trò chuyện'}
            </Text>
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <TouchableOpacity style={styles.composeButton}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.composeGradient}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Tìm kiếm"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            icon="magnify"
            iconColor="#9CA3AF"
          />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
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
            <LinearGradient
              colors={['#F3F4F6', '#E5E7EB']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="chatbubbles-outline" size={60} color="#9CA3AF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyText}>
              Bắt đầu cuộc trò chuyện{'\n'}với bạn bè của bạn
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
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  composeButton: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  composeGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 4,
  },
  searchBar: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
    height: 44,
  },
  searchInput: {
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#667eea',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MessagesScreen;
