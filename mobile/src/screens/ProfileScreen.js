import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Avatar, Button, Text, Title } from 'react-native-paper';
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
    <View style={styles.header}>
      <Avatar.Text
        size={80}
        label={user?.username?.[0]?.toUpperCase() || 'U'}
        style={styles.avatar}
      />
      <Title style={styles.name}>{user?.full_name || user?.username}</Title>
      <Text style={styles.username}>@{user?.username}</Text>
      {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton}>
        Logout
      </Button>
      <Text style={styles.postsTitle}>My Posts</Text>
    </View>
  );

  const renderPost = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        {item.content && <Text>{item.content}</Text>}
        {item.image_url && <Card.Cover source={{ uri: item.image_url }} style={styles.image} />}
      </Card.Content>
      <Card.Actions>
        <Text>{item.reaction_count || 0} reactions</Text>
        <Text>{item.comment_count || 0} comments</Text>
      </Card.Actions>
    </Card>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#1877f2',
  },
  name: {
    marginTop: 10,
    fontSize: 24,
  },
  username: {
    color: '#666',
    marginBottom: 10,
  },
  bio: {
    textAlign: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    marginTop: 10,
  },
  postsTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  card: {
    margin: 10,
  },
  image: {
    marginTop: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default ProfileScreen;
