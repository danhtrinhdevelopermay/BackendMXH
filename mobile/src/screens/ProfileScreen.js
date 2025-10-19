import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Avatar, Button, Text, Divider, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { postAPI, userAPI, friendshipAPI, messageAPI, streakAPI } from '../api/api';
import Constants from 'expo-constants';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import StreakIcon from '../components/StreakIcon';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const userId = route?.params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [stats, setStats] = useState({ posts_count: 0, friends_count: 0, photos_count: 0 });
  const [streaks, setStreaks] = useState([]);
  
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  const fetchUserData = async () => {
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        const [postsResponse, statsResponse, streaksResponse] = await Promise.all([
          postAPI.getUserPosts(currentUser.id),
          userAPI.getUserStats(currentUser.id),
          streakAPI.getUserStreaks()
        ]);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
        setStreaks(streaksResponse.data || []);
      } else {
        const [userResponse, postsResponse, statsResponse] = await Promise.all([
          userAPI.getUserById(userId),
          postAPI.getUserPosts(userId),
          userAPI.getUserStats(userId)
        ]);
        setProfileUser(userResponse.data);
        setFriendshipStatus(userResponse.data.friendship_status);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
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

  const handleLogout = () => {
    showAlert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      'warning',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleAddFriend = async () => {
    try {
      await friendshipAPI.sendFriendRequest({ addressee_id: userId });
      showAlert('Thành công', 'Đã gửi lời mời kết bạn', 'success');
      setFriendshipStatus('request_sent');
    } catch (error) {
      showAlert('Lỗi', 'Không thể gửi lời mời kết bạn', 'error');
    }
  };

  const handleMessage = () => {
    navigation.navigate('Chat', { 
      userId: userId, 
      userName: profileUser?.full_name || profileUser?.username,
      userAvatar: profileUser?.avatar_url
    });
  };

  const handleRespondRequest = () => {
    showAlert(
      'Lời mời kết bạn',
      `${profileUser?.full_name || profileUser?.username} muốn kết bạn với bạn`,
      'info',
      [
        {
          text: 'Từ chối',
          style: 'cancel',
          onPress: async () => {
            try {
              await friendshipAPI.respondToFriendRequest(profileUser.friendship_id, { status: 'rejected' });
              showAlert('Thành công', 'Đã từ chối lời mời', 'success');
              setFriendshipStatus(null);
            } catch (error) {
              showAlert('Lỗi', 'Không thể từ chối lời mời', 'error');
            }
          }
        },
        {
          text: 'Chấp nhận',
          onPress: async () => {
            try {
              await friendshipAPI.respondToFriendRequest(profileUser.friendship_id, { status: 'accepted' });
              showAlert('Thành công', 'Đã chấp nhận lời mời kết bạn', 'success');
              setFriendshipStatus('friends');
            } catch (error) {
              showAlert('Lỗi', 'Không thể chấp nhận lời mời', 'error');
            }
          }
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Cover Photo - Twitter Style */}
      <View style={styles.coverContainer}>
        {profileUser?.cover_url ? (
          <Image
            source={{ uri: `${API_URL}/api/cover/${profileUser.id}?${Date.now()}` }}
            style={styles.coverPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultCover} />
        )}
      </View>
      
      {/* Profile Info Section */}
      <View style={styles.profileSection}>
        {/* Avatar - Overlap on cover */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarContainer}>
            {profileUser?.id ? (
              <Image
                source={{ uri: `${API_URL}/api/avatar/${profileUser.id}?${Date.now()}` }}
                style={styles.avatarImage}
                onError={() => console.log('Avatar load error')}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={profileUser?.username?.[0]?.toUpperCase() || 'U'}
                style={styles.avatar}
              />
            )}
          </View>

          {/* Action Buttons - Top Right (Twitter Style) */}
          <View style={styles.topActions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#0f1419" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleMessage}
                >
                  <Ionicons name="mail-outline" size={20} color="#0f1419" />
                </TouchableOpacity>
                {friendshipStatus === 'friends' ? (
                  <TouchableOpacity style={styles.followingButton}>
                    <Ionicons name="checkmark" size={16} color="#0f1419" />
                    <Text style={styles.followingButtonText}>Bạn bè</Text>
                  </TouchableOpacity>
                ) : friendshipStatus === 'request_sent' ? (
                  <TouchableOpacity style={styles.pendingButton}>
                    <Text style={styles.pendingButtonText}>Đã gửi</Text>
                  </TouchableOpacity>
                ) : friendshipStatus === 'request_received' ? (
                  <TouchableOpacity 
                    style={styles.followButton}
                    onPress={handleRespondRequest}
                  >
                    <Text style={styles.followButtonText}>Phản hồi</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.followButton}
                    onPress={handleAddFriend}
                  >
                    <Text style={styles.followButtonText}>Kết bạn</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profileUser?.full_name || profileUser?.username}</Text>
            <VerifiedBadge isVerified={profileUser?.is_verified} size={18} />
          </View>
          <Text style={styles.username}>@{profileUser?.username}</Text>
          
          {profileUser?.bio && (
            <Text style={styles.bio}>{profileUser.bio}</Text>
          )}

          {/* Stats - Twitter Style (Inline) */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts_count} </Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.friends_count} </Text>
              <Text style={styles.statLabel}>Bạn bè</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.photos_count} </Text>
              <Text style={styles.statLabel}>Ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Streak Milestones Section */}
      {isOwnProfile && streaks.length > 0 && (
        <View style={styles.streaksContainer}>
          <View style={styles.streaksHeader}>
            <Text style={styles.streaksIcon}>🔥</Text>
            <Text style={styles.streaksTitle}>Streaks</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.streaksList}
            contentContainerStyle={styles.streaksContent}
          >
            {streaks.map((streak) => (
              <TouchableOpacity
                key={streak.other_user_id}
                style={styles.streakCard}
                onPress={() => navigation.navigate('Chat', {
                  userId: streak.other_user_id,
                  userName: streak.user?.full_name || streak.user?.username,
                  userAvatar: streak.user?.avatar_url
                })}
              >
                <UserAvatar 
                  user={streak.user}
                  userId={streak.other_user_id}
                  size={48}
                />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakName} numberOfLines={1}>
                    {streak.user?.full_name || streak.user?.username}
                  </Text>
                  <View style={styles.streakBadge}>
                    <StreakIcon count={streak.streak_count} size="small" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Posts Header */}
      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>Bài viết</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.postHeaderLeft}
          onPress={() => navigation.navigate('Profile', { userId: item.user_id })}
        >
          <UserAvatar 
            user={profileUser}
            size={48}
            style={styles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <View style={styles.postAuthorRow}>
              <Text style={styles.postAuthorName}>{profileUser?.full_name || profileUser?.username}</Text>
              <VerifiedBadge isVerified={profileUser?.is_verified} size={16} />
            </View>
            <Text style={styles.postUsername}>@{profileUser?.username} · {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {item.content && <Text style={styles.postContent}>{item.content}</Text>}
      
      {item.media_type && (() => {
        const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;
        const isVideo = item.media_type?.startsWith('video/');
        
        return (
          <View style={styles.mediaContainer}>
            {isVideo ? (
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              >
                <Video
                  source={{ uri: mediaUrl }}
                  style={styles.postMedia}
                  resizeMode="cover"
                  shouldPlay={false}
                  isLooping
                  isMuted={true}
                  onError={(error) => console.log('Video error:', error)}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              >
                <Image 
                  source={{ uri: mediaUrl }} 
                  style={styles.postMedia}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
      
      <View style={styles.postActions}>
        <View style={styles.actionItem}>
          <Ionicons name="heart-outline" size={18} color="#536471" />
          <Text style={styles.actionText}>{item.reaction_count || 0}</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#536471" />
          <Text style={styles.actionText}>{item.comment_count || 0}</Text>
        </View>
      </View>

      <View style={styles.postDivider} />
    </View>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#cfd9de" />
          <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
        </View>
      }
      contentContainerStyle={styles.container}
      style={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
  },
  coverContainer: {
    height: 200,
    backgroundColor: '#cfd9de',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#cfd9de',
  },
  profileSection: {
    paddingHorizontal: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: -40,
  },
  avatarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    padding: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    backgroundColor: '#1d9bf0',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cfd9de',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cfd9de',
    backgroundColor: '#ffffff',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f1419',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  followingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cfd9de',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  pendingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cfd9de',
    backgroundColor: '#ffffff',
  },
  pendingButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#536471',
  },
  userInfo: {
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f1419',
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 15,
    color: '#536471',
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    color: '#0f1419',
    lineHeight: 20,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  statLabel: {
    fontSize: 15,
    color: '#536471',
  },
  streaksContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eff3f4',
  },
  streaksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  streaksIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  streaksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  streaksList: {
    paddingLeft: 16,
  },
  streaksContent: {
    paddingRight: 16,
  },
  streakCard: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f7f9f9',
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#eff3f4',
  },
  streakInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  streakName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f1419',
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: 80,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postsHeader: {
    borderTopWidth: 1,
    borderTopColor: '#eff3f4',
    borderBottomWidth: 1,
    borderBottomColor: '#eff3f4',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  postsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  postContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  postAvatar: {
    backgroundColor: '#1d9bf0',
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1419',
  },
  postUsername: {
    fontSize: 15,
    color: '#536471',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#0f1419',
    marginLeft: 60,
    marginBottom: 12,
  },
  mediaContainer: {
    marginLeft: 60,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eff3f4',
  },
  postMedia: {
    width: '100%',
    height: 280,
  },
  postActions: {
    flexDirection: 'row',
    gap: 60,
    marginLeft: 60,
    paddingVertical: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#536471',
  },
  postDivider: {
    height: 1,
    backgroundColor: '#eff3f4',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#536471',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ProfileScreen;
