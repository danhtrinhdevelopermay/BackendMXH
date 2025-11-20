import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { postAPI, userAPI, friendshipAPI, storyAPI } from '../api/api';
import Constants from 'expo-constants';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 3) / 3;

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const userId = route?.params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('post');
  const [stats, setStats] = useState({ posts_count: 0, friends_count: 0, photos_count: 0 });
  
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  const fetchUserData = async () => {
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        const [postsResponse, statsResponse, storiesResponse] = await Promise.all([
          postAPI.getUserPosts(currentUser.id),
          userAPI.getUserStats(currentUser.id),
          storyAPI.getUserStories(currentUser.id).catch(() => ({ data: [] }))
        ]);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
        setStories(storiesResponse.data || []);
      } else {
        const [userResponse, postsResponse, statsResponse, storiesResponse] = await Promise.all([
          userAPI.getUserById(userId),
          postAPI.getUserPosts(userId),
          userAPI.getUserStats(userId),
          storyAPI.getUserStories(userId).catch(() => ({ data: [] }))
        ]);
        setProfileUser(userResponse.data);
        setPosts(postsResponse.data);
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
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#B2F5EA', '#81E6D9', '#4FD1C5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.nameDropdown}>
          <Text style={styles.headerName}>{profileUser?.full_name || profileUser?.username}</Text>
          <Ionicons name="chevron-down" size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="menu" size={24} color="#000" />
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

        <Text style={styles.displayName}>{profileUser?.full_name || profileUser?.username}</Text>
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
          <View style={styles.addStoryCircle}>
            <View style={styles.addStoryInner}>
              <Ionicons name="add" size={24} color="#4FD1C5" />
            </View>
          </View>
          <Text style={styles.storyLabel}>Add Story</Text>
        </TouchableOpacity>

        {stories.map((story, index) => (
          <TouchableOpacity 
            key={story.id || index}
            style={styles.storyItem}
            onPress={() => navigation.navigate('ViewStory', { storyId: story.id })}
          >
            <View style={styles.storyCircle}>
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
            name="add-circle-outline" 
            size={20} 
            color={activeTab === 'post' ? '#000' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'mention' && styles.activeTab]}
          onPress={() => setActiveTab('mention')}
        >
          <Ionicons 
            name="at-circle-outline" 
            size={20} 
            color={activeTab === 'mention' ? '#000' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'mention' && styles.activeTabText]}>Mention</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderPost = ({ item, index }) => {
    const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;
    const isVideo = item.media_type?.startsWith('video/');
    
    return (
      <TouchableOpacity 
        style={[
          styles.gridItem,
          index % 3 === 1 && styles.gridItemMiddle
        ]}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          </View>
        }
        numColumns={3}
        columnWrapperStyle={styles.row}
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
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  nameDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarWrapper: {
    marginBottom: 15,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#4FD1C5',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  storiesContainer: {
    marginBottom: 20,
    paddingLeft: 20,
  },
  storiesContent: {
    paddingRight: 20,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  addStoryInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyLabel: {
    fontSize: 11,
    color: '#000',
    marginTop: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
  row: {
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: 1,
  },
  gridItemMiddle: {
    marginHorizontal: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ProfileScreen;
