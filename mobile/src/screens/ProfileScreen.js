import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, StatusBar, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { postAPI, userAPI, friendshipAPI, storyAPI } from '../api/api';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import VerifiedBadge from '../components/VerifiedBadge';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const userId = route?.params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('post');
  const [stats, setStats] = useState({ posts_count: 0, friends_count: 0, photos_count: 0 });
  
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  const fetchUserData = async () => {
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        const [postsResponse, likedPostsResponse, statsResponse, storiesResponse] = await Promise.all([
          postAPI.getUserPosts(currentUser.id),
          postAPI.getUserLikedPosts(currentUser.id),
          userAPI.getUserStats(currentUser.id),
          storyAPI.getUserStories(currentUser.id).catch(() => ({ data: [] }))
        ]);
        setPosts(postsResponse.data);
        setLikedPosts(likedPostsResponse.data);
        setStats(statsResponse.data);
        setStories(storiesResponse.data || []);
      } else {
        const [userResponse, postsResponse, likedPostsResponse, statsResponse, storiesResponse] = await Promise.all([
          userAPI.getUserById(userId),
          postAPI.getUserPosts(userId),
          postAPI.getUserLikedPosts(userId),
          userAPI.getUserStats(userId),
          storyAPI.getUserStories(userId).catch(() => ({ data: [] }))
        ]);
        setProfileUser(userResponse.data);
        setPosts(postsResponse.data);
        setLikedPosts(likedPostsResponse.data);
        setStats(statsResponse.data);
        setStories(storiesResponse.data || []);
      }
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải thông tin người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchUserData();
      }
    }, [userId, currentUser])
  );

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}m`;
    if (num >= 1000) return `${Math.floor(num / 1000)}k`;
    return num.toString();
  };

  const renderHeader = () => (
    <ImageBackground
      source={{ uri: profileUser?.id ? `${API_URL}/api/avatar/${profileUser.id}?${Date.now()}` : undefined }}
      style={styles.headerContainer}
      blurRadius={30}
    >
      <View style={styles.overlay} />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.nameDropdown}>
          <Text style={styles.headerName}>{profileUser?.full_name || profileUser?.username}</Text>
          <Ionicons name="chevron-down" size={18} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarWrapper}>
          {profileUser?.id ? (
            <Image
              source={{ uri: `${API_URL}/api/avatar/${profileUser.id}?${Date.now()}` }}
              style={styles.avatarLarge}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profileUser?.username?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profileUser?.full_name || profileUser?.username}</Text>
          <VerifiedBadge isVerified={profileUser?.is_verified} size={20} />
        </View>
        <Text style={styles.username}>@{profileUser?.username}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.posts_count || 360}</Text>
            <Text style={styles.statLabel}>Post</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{formatNumber(stats.friends_count || 160000)}</Text>
            <Text style={styles.statLabel}>Follower</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{formatNumber(stats.photos_count || 140000)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        <TouchableOpacity 
          style={styles.storyItem}
          onPress={() => navigation.navigate('CreateStory')}
        >
          <View style={styles.addStoryBorder}>
            <View style={styles.addStoryInner}>
              <Ionicons name="add" size={28} color="#666" />
            </View>
          </View>
          <Text style={styles.storyLabel}>Add Story</Text>
        </TouchableOpacity>

        {stories.slice(0, 3).map((story, index) => (
          <TouchableOpacity 
            key={story.id || index}
            style={styles.storyItem}
            onPress={() => navigation.navigate('ViewStory', { storyId: story.id })}
          >
            <View style={styles.storyBorder}>
              <Image
                source={{ uri: story.media_url || `${API_URL}/api/story/${story.id}` }}
                style={styles.storyImage}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
          onPress={() => setActiveTab('post')}
        >
          <Ionicons 
            name="add-circle" 
            size={22} 
            color={activeTab === 'post' ? '#1a1a1a' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
          onPress={() => setActiveTab('liked')}
        >
          <Ionicons 
            name="heart" 
            size={22} 
            color={activeTab === 'liked' ? '#1a1a1a' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>Liked</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  const renderPost = ({ item }) => {
    const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;
    const isVideo = item.media_type?.startsWith('video/');
    
    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.gridImage}
            resizeMode="cover"
            shouldPlay={false}
            isMuted={true}
          />
        ) : (
          <Image 
            source={{ uri: mediaUrl }} 
            style={styles.gridImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  const displayData = activeTab === 'liked' 
    ? likedPosts.filter(p => p.media_url || p.media_type)
    : posts.filter(p => p.media_url || p.media_type);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FlatList
        data={displayData}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'liked' ? 'Chưa có bài viết đã thích' : 'Chưa có bài viết nào'}
            </Text>
          </View>
        }
        numColumns={3}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nameDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#999',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  username: {
    fontSize: 13,
    color: '#555',
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 50,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  storiesContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingLeft: 16,
  },
  storiesContent: {
    paddingRight: 16,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  addStoryBorder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addStoryInner: {
    width: 64,
    height: 64,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBorder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyLabel: {
    fontSize: 10,
    color: '#1a1a1a',
    marginTop: 6,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1a1a1a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ProfileScreen;
