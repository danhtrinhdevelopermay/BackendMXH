import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Pressable, Animated, Dimensions } from 'react-native';
import { Card, Avatar, IconButton, Text, Menu, Divider } from 'react-native-paper';
import { Video } from 'expo-av';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { postAPI, reactionAPI, storyAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';
import StoriesBar from '../components/StoriesBar';
import VerifiedBadge from '../components/VerifiedBadge';
import ReactionsModal from '../components/ReactionsModal';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState({});
  const [reactionMenuVisible, setReactionMenuVisible] = useState({});
  const [visibleItems, setVisibleItems] = useState([]);
  const [reactionsModalVisible, setReactionsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const videoRefs = useRef({});

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getNewsFeed();
      setPosts(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to fetch posts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getAllStories();
      setStories(response.data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStories();
      
      return () => {
        Object.values(videoRefs.current).forEach(async (video) => {
          if (video) {
            try {
              await video.pauseAsync();
            } catch (error) {
              console.log('Error pausing video:', error);
            }
          }
        });
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
    fetchStories();
  }, []);

  const handleReaction = async (postId, reactionType) => {
    try {
      await reactionAPI.addReaction(postId, { reaction_type: reactionType });
      setReactionMenuVisible({});
      fetchPosts();
    } catch (error) {
      showAlert('Error', 'Failed to add reaction', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    showAlert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postAPI.deletePost(postId);
              fetchPosts();
              showAlert('Success', 'Post deleted successfully', 'success');
            } catch (error) {
              showAlert('Error', 'Failed to delete post', 'error');
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (postId) => {
    setMenuVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleReactionMenu = (postId) => {
    setReactionMenuVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getReactionIcon = (reactionType) => {
    const icons = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡'
    };
    return icons[reactionType] || '👍';
  };

  const getReactionColor = (reactionType) => {
    const colors = {
      like: '#1877f2',
      love: '#f33e58',
      haha: '#f7b125',
      wow: '#f7b125',
      sad: '#f7b125',
      angry: '#e9710f'
    };
    return colors[reactionType] || '#65676b';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const visiblePostIds = viewableItems.map(item => item.item.id);
    setVisibleItems(visiblePostIds);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleVideoPress = async (postId) => {
    let videoPosition = 0;
    if (videoRefs.current[postId]) {
      try {
        const status = await videoRefs.current[postId].getStatusAsync();
        if (status.isLoaded) {
          videoPosition = status.positionMillis;
        }
        await videoRefs.current[postId].pauseAsync();
      } catch (error) {
        console.log('Error pausing video:', error);
      }
    }
    navigation.navigate('PostDetail', { postId, videoPosition });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.headerTitle}>Shatter</Text>
        <Text style={styles.headerSubtitle}>Chia sẻ khoảnh khắc của bạn</Text>
      </LinearGradient>
      
      <StoriesBar
        stories={stories}
        currentUserId={user?.id}
        onCreateStory={() => navigation.navigate('CreateStory')}
        onViewStory={(userId) => navigation.navigate('ViewStory', { userId })}
      />

      <Pressable 
        style={styles.postInputContainer}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <UserAvatar 
          user={user} 
          size={44}
          style={styles.headerAvatar}
        />
        <View style={styles.postInput}>
          <Text style={styles.postInputText}>Hôm nay bạn như thế nào?</Text>
        </View>
        <Ionicons name="image-outline" size={24} color="#667eea" />
      </Pressable>
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.cardWrapper}>
      <Card style={styles.card} elevation={2}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postHeaderLeft}
            onPress={() => navigation.navigate('Profile', { userId: item.user_id })}
          >
            <UserAvatar 
              user={item}
              size={48}
              style={styles.avatar}
            />
            <View style={styles.postHeaderInfo}>
              <View style={styles.authorNameContainer}>
                <Text style={styles.authorName}>{item.full_name || item.username}</Text>
                <VerifiedBadge isVerified={item.is_verified} size={16} />
              </View>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color="#8e8e93" />
                <Text style={styles.postTime}>{formatTimeAgo(item.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {user?.id === item.user_id && (
            <Menu
              visible={menuVisible[item.id] || false}
              onDismiss={() => toggleMenu(item.id)}
              anchor={
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => toggleMenu(item.id)}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#8e8e93" />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                leadingIcon="delete"
                onPress={() => {
                  toggleMenu(item.id);
                  handleDeletePost(item.id);
                }}
                title="Xóa bài viết"
              />
            </Menu>
          )}
        </View>

        {item.content && <Text style={styles.postContent}>{item.content}</Text>}
        
        {item.media_type && (() => {
          const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
          const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;
          const isVideo = item.media_type?.startsWith('video/');
          const isVisible = visibleItems.includes(item.id);
          
          return (
            <View style={styles.mediaContainer}>
              {isVideo ? (
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => handleVideoPress(item.id)}
                >
                  <Video
                    ref={(ref) => {
                      if (ref) {
                        videoRefs.current[item.id] = ref;
                      }
                    }}
                    source={{ uri: mediaUrl }}
                    style={styles.postMedia}
                    resizeMode="cover"
                    shouldPlay={isVisible}
                    isLooping
                    isMuted={false}
                    onError={(error) => console.log('Video error:', error)}
                  />
                </TouchableOpacity>
              ) : (
                <Card.Cover 
                  source={{ uri: mediaUrl }} 
                  style={styles.postMedia}
                />
              )}
            </View>
          );
        })()}

        {(item.reaction_count > 0 || item.comment_count > 0) && (
          <View style={styles.statsContainer}>
            {item.reaction_count > 0 && (
              <TouchableOpacity 
                style={styles.reactionStats}
                onPress={() => {
                  setSelectedPostId(item.id);
                  setReactionsModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.reactionBubblesContainer}>
                  {item.user_reaction && (
                    <View style={[styles.reactionBubble, { zIndex: 3 }]}>
                      <Text style={styles.reactionIcon}>{getReactionIcon(item.user_reaction)}</Text>
                    </View>
                  )}
                  {!item.user_reaction && (
                    <View style={[styles.reactionBubble, { zIndex: 3 }]}>
                      <Text style={styles.reactionIcon}>👍</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statsText}>{item.reaction_count}</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {item.comment_count > 0 && (
              <Text style={styles.statsText}>{item.comment_count} bình luận</Text>
            )}
          </View>
        )}

        <Divider style={styles.actionsDivider} />

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onLongPress={() => toggleReactionMenu(item.id)}
            onPress={() => handleReaction(item.id, item.user_reaction ? item.user_reaction : 'like')}
          >
            <View style={[
              styles.actionIconContainer,
              item.user_reaction && { backgroundColor: getReactionColor(item.user_reaction) + '15' }
            ]}>
              <Text style={[
                styles.actionIcon, 
                item.user_reaction && { color: getReactionColor(item.user_reaction) }
              ]}>
                {item.user_reaction ? getReactionIcon(item.user_reaction) : '👍'}
              </Text>
            </View>
            <Text style={[
              styles.actionText,
              item.user_reaction && { color: getReactionColor(item.user_reaction), fontWeight: '600' }
            ]}>
              {item.user_reaction ? item.user_reaction.charAt(0).toUpperCase() + item.user_reaction.slice(1) : 'Thích'}
            </Text>
          </TouchableOpacity>

          {reactionMenuVisible[item.id] && (
            <View style={styles.reactionMenu}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.reactionMenuGradient}
              >
                {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    onPress={() => handleReaction(item.id, reaction)}
                    style={styles.reactionOption}
                  >
                    <Text style={styles.reactionOptionIcon}>{getReactionIcon(reaction)}</Text>
                  </TouchableOpacity>
                ))}
              </LinearGradient>
            </View>
          )}

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Comments', { postId: item.id })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#667eea" />
            </View>
            <Text style={styles.actionText}>Bình luận</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-redo-outline" size={20} color="#667eea" />
            </View>
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea', '#764ba2']}
            tintColor="#667eea"
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
            <Text style={styles.emptyText}>Hãy bắt đầu chia sẻ khoảnh khắc của bạn!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      
      <ReactionsModal
        visible={reactionsModalVisible}
        onClose={() => setReactionsModalVisible(false)}
        postId={selectedPostId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  headerContainer: {
    marginBottom: 12,
  },
  gradientHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerAvatar: {
    backgroundColor: '#667eea',
  },
  postInput: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  postInputText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#667eea',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  postTime: {
    fontSize: 13,
    color: '#8e8e93',
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaContainer: {
    marginTop: 8,
    overflow: 'hidden',
  },
  postMedia: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionBubblesContainer: {
    flexDirection: 'row',
    marginRight: 6,
  },
  reactionBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  reactionIcon: {
    fontSize: 14,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionsDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  actionIcon: {
    fontSize: 16,
    color: '#667eea',
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  reactionMenu: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    borderRadius: 30,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
    overflow: 'hidden',
  },
  reactionMenuGradient: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  reactionOption: {
    padding: 8,
    marginHorizontal: 2,
  },
  reactionOptionIcon: {
    fontSize: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
