import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { Card, Avatar, Button, Text, Divider } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { postAPI } from '../api/api';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    try {
      const response = await postAPI.getUserPosts(user.id);
      setPosts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: 'https://via.placeholder.com/400x200/1877f2/ffffff?text=Cover+Photo' }}
          style={styles.coverPhoto}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={120}
            label={user?.username?.[0]?.toUpperCase() || 'U'}
            style={styles.avatar}
          />
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.full_name || user?.username}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <Divider style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            style={styles.editButton}
            buttonColor="#e4e6eb"
            textColor="#050505"
            icon="pencil"
          >
            Edit Profile
          </Button>
          <Button 
            mode="outlined" 
            onPress={handleLogout} 
            style={styles.logoutButton}
            textColor="#65676b"
          >
            Logout
          </Button>
        </View>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>Posts</Text>
      </View>
    </View>
  );

  const renderPost = ({ item }) => (
    <Card style={styles.postCard} elevation={0}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Avatar.Text 
            size={40} 
            label={user?.username?.[0]?.toUpperCase() || 'U'}
            style={styles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthorName}>{user?.full_name || user?.username}</Text>
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
        <Text style={styles.statText}>{item.reaction_count || 0} reactions</Text>
        <Text style={styles.statText}>{item.comment_count || 0} comments</Text>
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
          <Text style={styles.emptyText}>No posts yet</Text>
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
