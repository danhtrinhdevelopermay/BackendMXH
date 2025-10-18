import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      if (response && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.log('Failed to fetch messages:', error?.message || error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchThoughts = async () => {
    if (!user) return;
    
    try {
      const response = await thoughtAPI.getAllThoughts();
      if (response && response.data) {
        setThoughts(response.data);
        const userThought = response.data.find(t => t.user_id === user.id);
        setCurrentUserThought(userThought || null);
      }
    } catch (error) {
      console.log('Failed to fetch thoughts:', error?.message || error);
      setThoughts([]);
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
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter(item => {
    const name = (item.full_name || item.username || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderConversation = React.useCallback(({ item }) => {
    const isUnread = !item.is_read && item.sender_id !== item.other_user_id;
    const isOnline = Math.random() > 0.5; // TODO: Replace with real online status
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('Chat', { 
          userId: item.other_user_id, 
          userName: item.full_name || item.username,
          userAvatar: item.avatar_url
        })}
        activeOpacity={0.8}
        style={styles.conversationItem}
      >
        <View style={styles.avatarContainer}>
          <UserAvatar 
            user={item}
            userId={item.other_user_id}
            size={56}
          />
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.topRow}>
            <Text style={[styles.userName, isUnread && styles.unreadName]} numberOfLines={1}>
              {item.full_name || item.username}
            </Text>
            {isUnread && <View style={styles.unreadBadge} />}
          </View>
          
          <View style={styles.messageRow}>
            <Text 
              style={[styles.lastMessage, isUnread && styles.unreadMessage]} 
              numberOfLines={1}
            >
              {item.last_message || 'Bắt đầu trò chuyện'}
            </Text>
            <Text style={styles.timeText}>· {formatTime(item.last_message_time)}</Text>
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
      {/* Header - Messenger Style */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              style={styles.userAvatarButton}
            >
              <UserAvatar 
                user={user}
                userId={user.id}
                size={36}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tin nhắn</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="camera-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Messenger Style */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#65676B" style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm kiếm"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#65676B"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#65676B" />
            </TouchableOpacity>
          )}
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
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#0084FF', '#00C6FF']}
                style={styles.emptyGradient}
              >
                <Ionicons name="chatbubbles" size={48} color="#fff" />
              </LinearGradient>
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
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#050505',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
    padding: 0,
    height: 36,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#050505',
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: '600',
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0084FF',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#65676B',
    flex: 1,
    marginRight: 4,
  },
  unreadMessage: {
    color: '#050505',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#65676B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#050505',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#65676B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MessagesScreen;
