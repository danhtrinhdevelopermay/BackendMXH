import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { FAB, Card, Avatar, IconButton, Text, Chip, Menu } from 'react-native-paper';
import { postAPI, reactionAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState({});

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getNewsFeed();
      setPosts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleReaction = async (postId, reactionType) => {
    try {
      await reactionAPI.addReaction(postId, { reaction_type: reactionType });
      fetchPosts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postAPI.deletePost(postId);
              fetchPosts();
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (postId) => {
    setMenuVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderPost = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.full_name || item.username}
        subtitle={new Date(item.created_at).toLocaleDateString()}
        left={(props) => <Avatar.Text {...props} label={item.username[0].toUpperCase()} />}
        right={(props) =>
          user?.id === item.user_id ? (
            <Menu
              visible={menuVisible[item.id] || false}
              onDismiss={() => toggleMenu(item.id)}
              anchor={
                <IconButton
                  {...props}
                  icon="dots-vertical"
                  onPress={() => toggleMenu(item.id)}
                />
              }
            >
              <Menu.Item
                leadingIcon="delete"
                onPress={() => {
                  toggleMenu(item.id);
                  handleDeletePost(item.id);
                }}
                title="Delete"
              />
            </Menu>
          ) : null
        }
      />
      <Card.Content>
        {item.content && <Text style={styles.content}>{item.content}</Text>}
        {item.image_url && <Card.Cover source={{ uri: item.image_url }} style={styles.image} />}
      </Card.Content>
      <Card.Actions>
        <Chip icon="thumb-up" onPress={() => handleReaction(item.id, 'like')}>
          {item.user_reaction === 'like' ? 'Liked' : 'Like'} ({item.reaction_count || 0})
        </Chip>
        <IconButton
          icon="comment"
          size={20}
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
        />
        <Text>{item.comment_count || 0}</Text>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  card: {
    margin: 10,
  },
  content: {
    fontSize: 16,
    marginBottom: 10,
  },
  image: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1877f2',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default HomeScreen;
