import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import { friendshipAPI, postAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import Constants from 'expo-constants';

const SearchScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchData();
    } else {
      setUsers([]);
      setPosts([]);
    }
  }, [searchQuery, activeTab]);

  const searchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all' || activeTab === 'users') {
        const response = await friendshipAPI.searchUsers(searchQuery);
        setUsers(response.data);
      }
      if (activeTab === 'all' || activeTab === 'posts') {
        const response = await postAPI.searchPosts(searchQuery);
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendshipAPI.sendFriendRequest({ addressee_id: userId });
      setSentRequests(prev => new Set([...prev, userId]));
      showAlert('Thành công', 'Đã gửi lời mời kết bạn', 'success');
    } catch (error) {
      showAlert('Lỗi', 'Không thể gửi lời mời kết bạn', 'error');
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userContent}
        onPress={() => navigation.navigate('Profile', { userId: item.id })}
        activeOpacity={0.7}
      >
        <UserAvatar 
          user={item}
          size={60}
        />
        <View style={styles.userDetails}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName} numberOfLines={1}>{item.full_name || item.username}</Text>
            <VerifiedBadge isVerified={item.is_verified} size={16} />
          </View>
          <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        </View>
      </TouchableOpacity>
      <Button
        mode="contained"
        onPress={() => handleSendFriendRequest(item.id)}
        style={styles.addFriendButton}
        buttonColor="#1877f2"
        labelStyle={styles.addFriendLabel}
        disabled={sentRequests.has(item.id)}
        compact
      >
        {sentRequests.has(item.id) ? 'Đã gửi' : 'Thêm bạn bè'}
      </Button>
    </View>
  );

  const renderPost = ({ item }) => {
    const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
    const mediaUrl = item.media_url || (item.media_type ? `${API_URL}/api/media/${item.id}` : null);

    return (
      <TouchableOpacity 
        style={styles.postItem}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postAuthorInfo}
            onPress={() => navigation.navigate('Profile', { userId: item.user_id })}
          >
            <UserAvatar 
              user={{ id: item.user_id, avatar_url: item.avatar_url }}
              size={40}
            />
            <View style={styles.postAuthorDetails}>
              <View style={styles.postAuthorNameContainer}>
                <Text style={styles.postAuthorName}>{item.author_name}</Text>
                <VerifiedBadge isVerified={item.is_verified} size={14} />
              </View>
              <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</Text>
            </View>
          </TouchableOpacity>
        </View>
        {item.content && <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>}
        {mediaUrl && item.media_type?.startsWith('image/') && (
          <UserAvatar 
            user={{ avatar_url: mediaUrl }}
            size={200}
            style={styles.postImage}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchInputContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#050505" />
          </TouchableOpacity>
          <Ionicons name="search" size={20} color="#65676b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trên Shatter"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            placeholderTextColor="#65676b"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#65676b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
        <TouchableOpacity 
          style={[styles.filterChip, activeTab === 'all' && styles.activeFilterChip]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.filterText, activeTab === 'all' && styles.activeFilterText]}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, activeTab === 'users' && styles.activeFilterChip]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.filterText, activeTab === 'users' && styles.activeFilterText]}>Mọi người</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, activeTab === 'posts' && styles.activeFilterChip]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.filterText, activeTab === 'posts' && styles.activeFilterText]}>Bài viết</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877f2" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {searchQuery.trim().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color="#bcc0c4" />
              <Text style={styles.emptyTitle}>Tìm kiếm trên Shatter</Text>
              <Text style={styles.emptyText}>Tìm kiếm bạn bè, bài viết và nhiều hơn nữa</Text>
            </View>
          ) : (
            <>
              {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Mọi người</Text>
                  {users.map((item) => (
                    <View key={item.id}>{renderUser({ item })}</View>
                  ))}
                </View>
              )}
              
              {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bài viết</Text>
                  {posts.map((item) => (
                    <View key={item.id}>{renderPost({ item })}</View>
                  ))}
                </View>
              )}

              {users.length === 0 && posts.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={80} color="#bcc0c4" />
                  <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                  <Text style={styles.emptyText}>Hãy thử tìm kiếm với từ khóa khác</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#050505',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e4e6eb',
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#e7f3ff',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#65676b',
  },
  activeFilterText: {
    color: '#1877f2',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#050505',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  username: {
    fontSize: 14,
    color: '#65676b',
  },
  bio: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
  },
  addFriendButton: {
    alignSelf: 'flex-start',
    borderRadius: 6,
  },
  addFriendLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  postItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  postHeader: {
    marginBottom: 12,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorDetails: {
    marginLeft: 12,
  },
  postAuthorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  postTime: {
    fontSize: 13,
    color: '#65676b',
  },
  postContent: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default SearchScreen;
