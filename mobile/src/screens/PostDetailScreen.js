import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Text, Divider, Menu } from 'react-native-paper';
import { Video } from 'expo-av';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { postAPI, reactionAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import { LinearGradient } from 'expo-linear-gradient';

const PostDetailScreen = ({ route, navigation }) => {
  const { postId, videoPosition } = route.params;
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reactionMenuVisible, setReactionMenuVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await postAPI.getNewsFeed();
      const foundPost = response.data.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
      } else {
        showAlert('Error', 'Post not found', 'error');
        navigation.goBack();
      }
    } catch (error) {
      showAlert('Error', 'Failed to fetch post', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      if (reactionType === 'like' && post.user_reaction === 'like') {
        await reactionAPI.removeReaction(postId);
      } else {
        await reactionAPI.addReaction(postId, { reaction_type: reactionType });
      }
      setReactionMenuVisible(false);
      fetchPost();
    } catch (error) {
      showAlert('Error', 'Failed to update reaction', 'error');
    }
  };

  const handleDeletePost = async () => {
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
              showAlert('Success', 'Post deleted successfully', 'success');
              navigation.goBack();
            } catch (error) {
              showAlert('Error', 'Failed to delete post', 'error');
            }
          },
        },
      ]
    );
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

  const handleVideoLoad = async (status) => {
    if (videoPosition && videoRef.current && status.isLoaded) {
      try {
        await videoRef.current.setPositionAsync(videoPosition);
      } catch (error) {
        console.log('Error setting video position:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!post) {
    return null;
  }

  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
  const mediaUrl = post.media_url || `${API_URL}/api/media/${post.id}`;
  const isVideo = post.media_type?.startsWith('video/');
  
  const aspectRatio = (post.media_width && post.media_height) 
    ? post.media_width / post.media_height 
    : 16/9;
  
  const mediaStyle = {
    width: '100%',
    aspectRatio: aspectRatio,
    backgroundColor: '#000',
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={2}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.postHeaderLeft}
            onPress={() => navigation.navigate('Profile', { userId: post.user_id })}
          >
            <UserAvatar 
              user={post}
              size={48}
              style={styles.avatar}
            />
            <View style={styles.postHeaderInfo}>
              <View style={styles.authorNameContainer}>
                <Text style={styles.authorName}>{post.full_name || post.username}</Text>
                <VerifiedBadge isVerified={post.is_verified} size={16} />
              </View>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color="#8e8e93" />
                <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {user?.id === post.user_id && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setMenuVisible(true)}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#8e8e93" />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                leadingIcon="delete"
                onPress={() => {
                  setMenuVisible(false);
                  handleDeletePost();
                }}
                title="Xóa bài viết"
              />
            </Menu>
          )}
        </View>

        {post.content && <Text style={styles.postContent}>{post.content}</Text>}
        
        {post.media_type && (
          <View style={styles.mediaContainer}>
            {isVideo ? (
              <>
                {!videoError ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: mediaUrl }}
                    style={mediaStyle}
                    useNativeControls
                    resizeMode="contain"
                    isLooping
                    shouldPlay={true}
                    onLoad={handleVideoLoad}
                    onError={(error) => {
                      console.log('Video error:', error);
                      setVideoError(true);
                    }}
                  />
                ) : (
                  <View style={[mediaStyle, styles.errorContainer]}>
                    <Ionicons name="videocam-off" size={48} color="#8e8e93" />
                    <Text style={styles.errorText}>Không thể tải video</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {imageLoading && !imageError && (
                  <View style={[mediaStyle, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#FF6B35" />
                  </View>
                )}
                {!imageError ? (
                  <Card.Cover 
                    source={{ uri: mediaUrl }} 
                    style={[mediaStyle, imageLoading && { display: 'none' }]}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                ) : (
                  <View style={[mediaStyle, styles.errorContainer]}>
                    <Ionicons name="image-off" size={48} color="#8e8e93" />
                    <Text style={styles.errorText}>Không thể tải ảnh</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {(post.reaction_count > 0 || post.comment_count > 0) && (
          <View style={styles.statsContainer}>
            {post.reaction_count > 0 && (
              <View style={styles.reactionStats}>
                {(() => {
                  const reactionBreakdown = post.reaction_breakdown || {};
                  const reactionTypes = ["like", "love", "haha", "wow", "sad", "angry"];
                  const activeReactions = reactionTypes.filter(type => (reactionBreakdown[type] || 0) > 0);
                  
                  if (activeReactions.length > 0) {
                    return (
                      <>
                        <View style={styles.reactionIconsContainer}>
                          {activeReactions.slice(0, 3).map((type, index) => (
                            <View key={type} style={[styles.reactionBubble, index > 0 && { marginLeft: -6 }]}>
                              <Text style={styles.reactionIcon}>{getReactionIcon(type)}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.statsText}>{post.reaction_count}</Text>
                      </>
                    );
                  }
                  
                  return (
                    <>
                      <View style={styles.reactionBubble}>
                        <Text style={styles.reactionIcon}>👍</Text>
                      </View>
                      <Text style={styles.statsText}>{post.reaction_count}</Text>
                    </>
                  );
                })()}
              </View>
            )}
            <View style={{ flex: 1 }} />
            {post.comment_count > 0 && (
              <Text style={styles.statsText}>{post.comment_count} bình luận</Text>
            )}
          </View>
        )}

        <Divider style={styles.actionsDivider} />

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onLongPress={() => setReactionMenuVisible(!reactionMenuVisible)}
            onPress={() => handleReaction('like')}
          >
            <View style={[
              styles.actionIconContainer,
              post.user_reaction && { backgroundColor: getReactionColor(post.user_reaction) + '15' }
            ]}>
              <Text style={[
                styles.actionIcon, 
                post.user_reaction && { color: getReactionColor(post.user_reaction) }
              ]}>
                {post.user_reaction ? getReactionIcon(post.user_reaction) : '👍'}
              </Text>
            </View>
            <Text style={[
              styles.actionText,
              post.user_reaction && { color: getReactionColor(post.user_reaction), fontWeight: '600' }
            ]}>
              {post.user_reaction ? post.user_reaction.charAt(0).toUpperCase() + post.user_reaction.slice(1) : 'Thích'}
            </Text>
          </TouchableOpacity>

          {reactionMenuVisible && (
            <View style={styles.reactionMenu}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.reactionMenuGradient}
              >
                {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    onPress={() => handleReaction(reaction)}
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
            onPress={() => navigation.navigate('Comments', { postId: post.id })}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
            </View>
            <Text style={styles.actionText}>Bình luận</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-redo-outline" size={20} color="#FF6B35" />
            </View>
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
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
    backgroundColor: '#FF6B35',
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
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaContainer: {
    marginTop: 8,
  },
  postMedia: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8e8e93',
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
    gap: 6,
  },
  reactionIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e8f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  reactionIcon: {
    fontSize: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#65676b',
  },
  actionsDivider: {
    backgroundColor: '#e4e6eb',
    height: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
  },
  reactionMenu: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    zIndex: 1000,
    elevation: 5,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reactionMenuGradient: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 25,
  },
  reactionOption: {
    marginHorizontal: 4,
    padding: 6,
  },
  reactionOptionIcon: {
    fontSize: 28,
  },
});

export default PostDetailScreen;
