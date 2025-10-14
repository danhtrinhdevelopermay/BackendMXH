import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Avatar, Button, Text, Divider, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { postAPI, userAPI, friendshipAPI, messageAPI } from '../api/api';
import Constants from 'expo-constants';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const userId = route?.params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  const fetchUserData = async () => {
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        const response = await postAPI.getUserPosts(currentUser.id);
        setPosts(response.data);
      } else {
        const [userResponse, postsResponse] = await Promise.all([
          userAPI.getUserById(userId),
          postAPI.getUserPosts(userId)
        ]);
        setProfileUser(userResponse.data);
        setFriendshipStatus(userResponse.data.friendship_status);
        setPosts(postsResponse.data);
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
      <View style={styles.coverContainer}>
        {profileUser?.cover_url ? (
          <Image
            source={{ uri: `${API_URL}/api/cover/${profileUser.id}?${Date.now()}` }}
            style={styles.coverPhoto}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverPhoto}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.3)']}
          style={styles.coverGradient}
        />
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {profileUser?.id ? (
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: `${API_URL}/api/avatar/${profileUser.id}?${Date.now()}` }}
                style={styles.avatarImage}
                onError={() => console.log('Avatar load error')}
              />
              <View style={styles.avatarBorder} />
            </View>
          ) : (
            <View style={styles.avatarWrapper}>
              <Avatar.Text
                size={130}
                label={profileUser?.username?.[0]?.toUpperCase() || 'U'}
                style={styles.avatar}
              />
              <View style={styles.avatarBorder} />
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profileUser?.full_name || profileUser?.username}</Text>
            <VerifiedBadge isVerified={profileUser?.is_verified} size={20} />
          </View>
          <Text style={styles.username}>@{profileUser?.username}</Text>
          {profileUser?.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bio}>{profileUser.bio}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="post-outline" size={20} color="#1877f2" />
            </View>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </TouchableOpacity>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-group" size={20} color="#1877f2" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Bạn bè</Text>
          </TouchableOpacity>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="image-multiple" size={20} color="#1877f2" />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Ảnh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.gradientButton}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Chỉnh sửa hồ sơ</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={18} color="#65676b" />
                <Text style={styles.secondaryButtonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {friendshipStatus === 'friends' ? (
                <TouchableOpacity style={styles.friendButton}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#42b72a" />
                  <Text style={styles.friendButtonText}>Bạn bè</Text>
                </TouchableOpacity>
              ) : friendshipStatus === 'request_sent' ? (
                <TouchableOpacity style={styles.requestSentButton}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#65676b" />
                  <Text style={styles.requestSentButtonText}>Đã gửi lời mời</Text>
                </TouchableOpacity>
              ) : friendshipStatus === 'request_received' ? (
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleRespondRequest}
                >
                  <LinearGradient
                    colors={['#1877f2', '#0c63d4']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                  >
                    <MaterialCommunityIcons name="account-check" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Phản hồi</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleAddFriend}
                >
                  <LinearGradient
                    colors={['#1877f2', '#0c63d4']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.gradientButton}
                  >
                    <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Thêm bạn bè</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleMessage}
              >
                <MaterialCommunityIcons name="message-text" size={18} color="#1877f2" />
                <Text style={styles.messageButtonText}>Nhắn tin</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.postsHeader}>
        <MaterialCommunityIcons name="grid" size={20} color="#050505" />
        <Text style={styles.postsTitle}>Bài viết</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }) => (
    <Card style={styles.postCard} elevation={0}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.postHeaderLeft}
          onPress={() => navigation.navigate('Profile', { userId: item.user_id })}
        >
          <UserAvatar 
            user={profileUser}
            size={40}
            style={styles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <View style={styles.postAuthorNameContainer}>
              <Text style={styles.postAuthorName}>{profileUser?.full_name || profileUser?.username}</Text>
              <VerifiedBadge isVerified={profileUser?.is_verified} size={14} />
            </View>
            <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
                  style={styles.postImage}
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
                <Card.Cover 
                  source={{ uri: mediaUrl }} 
                  style={styles.postImage}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
      
      <View style={styles.postStats}>
        <View style={styles.postStatItem}>
          <MaterialCommunityIcons name="heart" size={16} color="#f02849" />
          <Text style={styles.statText}>{item.reaction_count || 0}</Text>
        </View>
        <View style={styles.postStatItem}>
          <MaterialCommunityIcons name="comment" size={16} color="#65676b" />
          <Text style={styles.statText}>{item.comment_count || 0}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="post-outline" size={64} color="#ccd0d5" />
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
    backgroundColor: '#f0f2f5',
  },
  container: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  coverContainer: {
    height: 220,
    backgroundColor: '#1877f2',
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -70,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#1877f2',
  },
  avatarImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#fff',
  },
  avatarBorder: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#e4e6eb',
    top: -5,
    left: -5,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#050505',
    letterSpacing: 0.3,
  },
  username: {
    fontSize: 15,
    color: '#65676b',
    marginTop: 4,
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
  },
  bio: {
    fontSize: 15,
    color: '#050505',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e4e6eb',
    alignSelf: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#050505',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1877f2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#65676b',
    fontSize: 15,
    fontWeight: '600',
  },
  messageButtonText: {
    color: '#1877f2',
    fontSize: 15,
    fontWeight: '600',
  },
  friendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e7f3ff',
    gap: 8,
  },
  friendButtonText: {
    color: '#42b72a',
    fontSize: 15,
    fontWeight: '600',
  },
  requestSentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    gap: 8,
  },
  requestSentButtonText: {
    color: '#65676b',
    fontSize: 15,
    fontWeight: '600',
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 8,
    borderTopColor: '#f0f2f5',
    gap: 8,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050505',
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 0,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    backgroundColor: '#1877f2',
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postAuthorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  postTime: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    color: '#050505',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaContainer: {
    width: '100%',
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postStats: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
