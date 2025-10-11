import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Avatar, Button, Text, Divider } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { postAPI, userAPI, friendshipAPI, messageAPI } from '../api/api';
import Constants from 'expo-constants';
import UserAvatar from '../components/UserAvatar';

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

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [userId, currentUser]);

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
      userName: profileUser?.full_name || profileUser?.username 
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
        <Image
          source={{ 
            uri: profileUser?.id ? `${API_URL}/api/cover/${profileUser.id}?${Date.now()}` : 'https://via.placeholder.com/400x200/1877f2/ffffff?text=Cover+Photo' 
          }}
          style={styles.coverPhoto}
          resizeMode="cover"
          defaultSource={require('../../assets/icon.png')}
          onError={() => console.log('Cover photo load error')}
        />
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {profileUser?.id ? (
            <Image
              source={{ uri: `${API_URL}/api/avatar/${profileUser.id}?${Date.now()}` }}
              style={styles.avatarImage}
              onError={() => console.log('Avatar load error')}
            />
          ) : (
            <Avatar.Text
              size={120}
              label={profileUser?.username?.[0]?.toUpperCase() || 'U'}
              style={styles.avatar}
            />
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profileUser?.full_name || profileUser?.username}</Text>
          <Text style={styles.username}>@{profileUser?.username}</Text>
          {profileUser?.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Bạn bè</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Ảnh</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.editButton}
                buttonColor="#e4e6eb"
                textColor="#050505"
                icon="pencil"
              >
                Chỉnh sửa
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleLogout} 
                style={styles.logoutButton}
                textColor="#65676b"
              >
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              {friendshipStatus === 'friends' ? (
                <Button 
                  mode="contained" 
                  style={styles.friendButton}
                  buttonColor="#e4e6eb"
                  textColor="#050505"
                  icon="check"
                >
                  Bạn bè
                </Button>
              ) : friendshipStatus === 'request_sent' ? (
                <Button 
                  mode="contained" 
                  style={styles.requestSentButton}
                  buttonColor="#e4e6eb"
                  textColor="#050505"
                  icon="clock-outline"
                >
                  Đã gửi lời mời
                </Button>
              ) : friendshipStatus === 'request_received' ? (
                <Button 
                  mode="contained" 
                  onPress={handleRespondRequest}
                  style={styles.respondButton}
                  buttonColor="#1877f2"
                  textColor="#fff"
                  icon="account-check"
                >
                  Phản hồi
                </Button>
              ) : (
                <Button 
                  mode="contained" 
                  onPress={handleAddFriend}
                  style={styles.addFriendButton}
                  buttonColor="#1877f2"
                  textColor="#fff"
                  icon="account-plus"
                >
                  Thêm bạn bè
                </Button>
              )}
              <Button 
                mode="outlined" 
                onPress={handleMessage}
                style={styles.messageButton}
                textColor="#050505"
                icon="message"
              >
                Nhắn tin
              </Button>
            </>
          )}
        </View>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>Bài viết</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }) => (
    <Card style={styles.postCard} elevation={0}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <UserAvatar 
            user={profileUser}
            size={40}
            style={styles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthorName}>{profileUser?.full_name || profileUser?.username}</Text>
            <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      
      {item.content && <Text style={styles.postContent}>{item.content}</Text>}
      {item.image_url && (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.reaction_count || 0} lượt thích</Text>
        <Text style={styles.statText}>{item.comment_count || 0} bình luận</Text>
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
          <Text style={styles.emptyText}>Chưa có bài viết</Text>
        </View>
      }
      contentContainerStyle={styles.container}
      style={styles.list}
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
    height: 200,
    backgroundColor: '#1877f2',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -60,
  },
  avatar: {
    backgroundColor: '#1877f2',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#050505',
  },
  username: {
    fontSize: 15,
    color: '#65676b',
    marginTop: 4,
  },
  bio: {
    fontSize: 15,
    color: '#050505',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e4e6eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e4e6eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
  },
  statLabel: {
    fontSize: 14,
    color: '#65676b',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
  },
  logoutButton: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#ccd0d5',
  },
  addFriendButton: {
    flex: 1,
    borderRadius: 8,
  },
  friendButton: {
    flex: 1,
    borderRadius: 8,
  },
  requestSentButton: {
    flex: 1,
    borderRadius: 8,
  },
  respondButton: {
    flex: 1,
    borderRadius: 8,
  },
  messageButton: {
    flex: 1,
    borderRadius: 8,
    borderColor: '#ccd0d5',
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 8,
    borderTopColor: '#f0f2f5',
  },
  postsTitle: {
    fontSize: 20,
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
  postImage: {
    width: '100%',
    height: 300,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statText: {
    fontSize: 13,
    color: '#65676b',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default ProfileScreen;
