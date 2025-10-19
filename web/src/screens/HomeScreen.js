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
  const [mediaErrors, setMediaErrors] = useState({});
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

  const handleReaction = async (postId, reactionType, currentReaction) => {
    try {
      if (reactionType === 'like' && currentReaction === 'like') {
        await reactionAPI.removeReaction(postId);
      } else {
        await reactionAPI.addReaction(postId, { reaction_type: reactionType });
      }
      setReactionMenuVisible({});
      fetchPosts();
    } catch (error) {
      showAlert('Error', 'Failed to update reaction', 'error');
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
      <View style={styles.fbHeader}>
        <Text style={styles.fbLogo}>Shatter xin chào</Text>
        
      </View>
      
      <Pressable 
        style={styles.createPostContainer}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <View style={styles.createPostTop}>
          <UserAvatar 
            user={user} 
            size={40}
          />
          <View style={styles.createPostInput}>
            <Text style={styles.createPostText}>Bạn đang nghĩ gì?</Text>
          </View>
        </View>
        <View style={styles.createPostDivider} />
        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.createPostAction}>
            <Ionicons name="videocam" size={24} color="#f3425f" />
            <Text style={styles.createActionText}>Video trực tiếp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createPostAction}>
            <Ionicons name="image" size={24} color="#45bd62" />
            <Text style={styles.createActionText}>Ảnh/video</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <StoriesBar
        stories={stories}
        currentUserId={user?.id}
        onCreateStory={() => navigation.navigate('CreateStory')}
        onViewStory={(userId) => navigation.navigate('ViewStory', { userId })}
      />
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

        {item.content && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Text style={styles.postContent}>{item.content}</Text>
          </TouchableOpacity>
        )}
        
        {item.media_type && item.media_url && (() => {
          const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
          const mediaUrl = item.media_url.startsWith('http') ? item.media_url : `${API_URL}${item.media_url}`;
          const isVideo = item.media_type?.startsWith('video/');
          const isVisible = visibleItems.includes(item.id);
          const hasError = mediaErrors[item.id];
          
          const handleMediaError = () => {
            setMediaErrors(prev => ({ ...prev, [item.id]: true }));
          };
          
          if (hasError) {
            return (
              <View style={styles.mediaErrorContainer}>
                <Ionicons name="image-outline" size={48} color="#d1d5db" />
                <Text style={styles.mediaErrorText}>Không thể tải media</Text>
              </View>
            );
          }
          
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
                    resizeMode="contain"
                    useNativeControls
                    shouldPlay={isVisible}
                    isLooping
                    isMuted={false}
                    onError={(error) => {
                      console.log('Video error:', error);
                      handleMediaError();
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  activeOpacity={1}
                  onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                >
                  <Card.Cover 
                    source={{ uri: mediaUrl }} 
                    style={styles.postMedia}
                    onError={handleMediaError}
                  />
                </TouchableOpacity>
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
            style={styles.fbActionButton}
            onLongPress={() => toggleReactionMenu(item.id)}
            onPress={() => handleReaction(item.id, 'like', item.user_reaction)}
          >
            {item.user_reaction ? (
              <>
                <Text style={styles.fbActionIcon}>{getReactionIcon(item.user_reaction)}</Text>
                <Text style={[styles.fbActionText, { color: getReactionColor(item.user_reaction) }]}>
                  {item.user_reaction.charAt(0).toUpperCase() + item.user_reaction.slice(1)}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="thumbs-up-outline" size={20} color="#65676b" />
                <Text style={styles.fbActionText}>Thích</Text>
              </>
            )}
          </TouchableOpacity>

          {reactionMenuVisible[item.id] && (
            <View style={styles.fbReactionMenu}>
              <View style={styles.fbReactionMenuContent}>
                {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    onPress={() => handleReaction(item.id, reaction, item.user_reaction)}
                    style={styles.fbReactionOption}
                  >
                    <Text style={styles.fbReactionIcon}>{getReactionIcon(reaction)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.fbActionButton}
            onPress={() => navigation.navigate('Comments', { postId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#65676b" />
            <Text style={styles.fbActionText}>Bình luận</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fbActionButton}>
            <Ionicons name="arrow-redo-outline" size={20} color="#65676b" />
            <Text style={styles.fbActionText}>Chia sẻ</Text>
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
            colors={['#1877f2']}
            tintColor="#1877f2"
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
    backgroundColor: '#f0f2f5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  fbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  fbLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1877f2',
    fontFamily: 'System',
  },
  fbHeaderIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  fbIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e4e6eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e6eb',
  },
  createPostTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createPostInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e6eb',
  },
  createPostText: {
    color: '#65676b',
    fontSize: 16,
  },
  createPostDivider: {
    height: 1,
    backgroundColor: '#e4e6eb',
    marginVertical: 12,
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  createPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createActionText: {
    fontSize: 15,
    color: '#65676b',
    fontWeight: '500',
  },
  cardWrapper: {
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderTopWidth: 8,
    borderTopColor: '#f0f2f5',
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
    backgroundColor: '#1877f2',
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
    minHeight: 300,
    maxHeight: 600,
    aspectRatio: 'auto',
    backgroundColor: '#000',
  },
  mediaErrorContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaErrorText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
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
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    paddingVertical: 4,
    paddingHorizontal: 4,
    position: 'relative',
  },
  fbActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    flex: 1,
    gap: 6,
  },
  fbActionIcon: {
    fontSize: 18,
  },
  fbActionText: {
    fontSize: 15,
    color: '#65676b',
    fontWeight: '600',
  },
  fbReactionMenu: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    zIndex: 1000,
  },
  fbReactionMenuContent: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e6eb',
  },
  fbReactionOption: {
    padding: 6,
    marginHorizontal: 2,
  },
  fbReactionIcon: {
    fontSize: 32,
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
