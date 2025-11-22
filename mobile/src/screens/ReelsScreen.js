import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { reelsAPI, reactionAPI, commentAPI } from '../api/api';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const ReelItem = ({ item, isActive, navigation, onLike, onComment, onShare }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [liked, setLiked] = useState(item.user_reaction === 'like');
  const [likeCount, setLikeCount] = useState(item.reaction_count || 0);
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
  const isTikTok = item.source === 'tiktok';

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
    } else if (!isActive && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  const handleLike = async () => {
    if (isTikTok) return; // TikTok videos can't be liked
    
    const newLiked = !liked;
    const prevLiked = liked;
    const prevCount = likeCount;
    
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      await onLike(item.id, newLiked);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleVideoPress = async () => {
    if (videoRef.current) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;

  return (
    <View style={styles.reelContainer}>
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={handleVideoPress}
      >
        <Video
          ref={videoRef}
          source={{ uri: mediaUrl }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={isActive}
          isLooping
          isMuted={false}
          onPlaybackStatusUpdate={setStatus}
        />
      </TouchableOpacity>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {/* User Info */}
      <View style={styles.userInfo}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => navigation.navigate('Profile', { userId: item.user_id })}
        >
          <UserAvatar userId={item.user_id} size={40} />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.user?.full_name || item.user?.username}</Text>
              <VerifiedBadge isVerified={item.user?.is_verified} size={14} />
            </View>
            <Text style={styles.username}>@{item.user?.username}</Text>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {item.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={32}
            color={liked ? '#ff2d55' : '#fff'}
          />
          <Text style={styles.actionText}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(item)}
        >
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{formatCount(item.comment_count || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onShare(item)}
        >
          <Ionicons name="arrow-redo-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {item.source === 'tiktok' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="logo-tiktok" size={30} color="#fff" />
            <Text style={styles.actionText}>TikTok</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Play/Pause Indicator */}
      {!status.isPlaying && status.isBuffering !== true && (
        <View style={styles.playPauseOverlay}>
          <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.7)" />
        </View>
      )}
    </View>
  );
};

const formatCount = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const ReelsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const fetchReels = async () => {
    try {
      const response = await reelsAPI.getReels();
      setReels(response.data);
    } catch (error) {
      console.error('Failed to fetch reels:', error);
      showAlert('Lỗi', 'Không thể tải reels', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const handleLike = async (reelId, isLiked) => {
    if (isLiked) {
      await reactionAPI.addReaction(reelId, { reaction_type: 'like' });
    } else {
      await reactionAPI.removeReaction(reelId);
    }
  };

  const handleComment = (reel) => {
    navigation.navigate('Comments', { postId: reel.id });
  };

  const handleShare = (reel) => {
    // Implement share functionality
    showAlert('Chia sẻ', 'Tính năng chia sẻ đang được phát triển', 'info');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onRefresh = () => {
    setRefreshing(true);
    fetchReels();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === currentIndex}
            navigation={navigation}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Chưa có reels nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  reelContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: width,
    height: height,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  userInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  username: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  followButton: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default ReelsScreen;
