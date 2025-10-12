import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { friendshipAPI, postAPI } from '../api/api';
import Constants from 'expo-constants';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

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
      if (activeTab === 'users') {
        const response = await friendshipAPI.searchUsers(searchQuery);
        setUsers(response.data);
      } else {
        const response = await postAPI.searchPosts(searchQuery);
        setPosts(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      <View style={styles.userInfo}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#65676b" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#65676b" />
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => {
    const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
    const mediaUrl = item.media_url || (item.media_type ? `${API_URL}/api/media/${item.id}` : null);

    return (
      <TouchableOpacity 
        style={styles.postItem}
        onPress={() => navigation.navigate('Home')}
      >
        <View style={styles.postHeader}>
          <View style={styles.postAuthorInfo}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.postAvatar} />
            ) : (
              <View style={[styles.postAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={16} color="#65676b" />
              </View>
            )}
            <View>
              <Text style={styles.postAuthorName}>{item.author_name}</Text>
              <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>
        {item.content && <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>}
        {mediaUrl && item.media_type?.startsWith('image/') && (
          <Image source={{ uri: mediaUrl }} style={styles.postImage} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#65676b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm người dùng hoặc bài viết..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#65676b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Người dùng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Bài viết</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877f2" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'users' ? users : posts}
          renderItem={activeTab === 'users' ? renderUser : renderPost}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            searchQuery.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#e4e6eb" />
                <Text style={styles.emptyText}>
                  {activeTab === 'users' ? 'Không tìm thấy người dùng' : 'Không tìm thấy bài viết'}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#e4e6eb" />
                <Text style={styles.emptyText}>Nhập từ khóa để tìm kiếm</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#050505',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1877f2',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#65676b',
  },
  activeTabText: {
    color: '#1877f2',
  },
  listContainer: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  username: {
    fontSize: 14,
    color: '#65676b',
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
  },
  postItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  postAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
  },
  postTime: {
    fontSize: 12,
    color: '#65676b',
  },
  postContent: {
    fontSize: 14,
    color: '#050505',
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    marginTop: 16,
  },
});

export default SearchScreen;
