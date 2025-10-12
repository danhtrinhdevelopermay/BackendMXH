import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { Card, Avatar, IconButton, Text, Menu, Divider } from 'react-native-paper';
import { Video } from 'expo-av';
import Constants from 'expo-constants';
import { postAPI, reactionAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState({});
  const [reactionMenuVisible, setReactionMenuVisible] = useState({});

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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Pressable 
        style={styles.postInputContainer}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <UserAvatar 
          user={user} 
          size={40}
          style={styles.headerAvatar}
        />
        <View style={styles.postInput}>
          <Text style={styles.postInputText}>Hôm nay bạn như thế nào?</Text>
        </View>
      </Pressable>
      <Divider style={styles.headerDivider} />
    </View>
  );

  const renderPost = ({ item }) => (
    <Card style={styles.card} elevation={0}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <UserAvatar 
            user={item}
            size={40}
            style={styles.avatar}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.authorName}>{item.full_name || item.username}</Text>
            <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        {user?.id === item.user_id && (
          <Menu
            visible={menuVisible[item.id] || false}
            onDismiss={() => toggleMenu(item.id)}
            anchor={
              <IconButton
                icon="dots-horizontal"
                size={20}
                onPress={() => toggleMenu(item.id)}
                iconColor="#65676b"
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
        )}
      </View>

      {item.content && <Text style={styles.postContent}>{item.content}</Text>}
      
      {item.media_type && (() => {
        const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
        const mediaUrl = item.media_url || `${API_URL}/api/media/${item.id}`;
        const isVideo = item.media_type?.startsWith('video/');
        
        return (
          <Pressable onPress={() => {}}>
            {isVideo ? (
              <Video
                source={{ uri: mediaUrl }}
                style={styles.postImage}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
                onError={(error) => console.log('Video error:', error)}
              />
            ) : (
              <Card.Cover 
                source={{ uri: mediaUrl }} 
                style={styles.postImage}
              />
            )}
          </Pressable>
        );
      })()}

      {(item.reaction_count > 0 || item.comment_count > 0) && (
        <View style={styles.statsContainer}>
          {item.reaction_count > 0 && (
            <View style={styles.reactionStats}>
              <Text style={styles.reactionIcon}>{getReactionIcon(item.user_reaction || 'like')}</Text>
              <Text style={styles.statsText}>{item.reaction_count}</Text>
            </View>
          )}
          {item.comment_count > 0 && (
            <Text style={styles.statsText}>{item.comment_count} comments</Text>
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
          <Text style={[
            styles.actionIcon, 
            item.user_reaction && { color: getReactionColor(item.user_reaction) }
          ]}>
            {item.user_reaction ? getReactionIcon(item.user_reaction) : '👍'}
          </Text>
          <Text style={[
            styles.actionText,
            item.user_reaction && { color: getReactionColor(item.user_reaction), fontWeight: '600' }
          ]}>
            {item.user_reaction ? item.user_reaction.charAt(0).toUpperCase() + item.user_reaction.slice(1) : 'Like'}
          </Text>
        </TouchableOpacity>

        {reactionMenuVisible[item.id] && (
          <View style={styles.reactionMenu}>
            {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((reaction) => (
              <TouchableOpacity
                key={reaction}
                onPress={() => handleReaction(item.id, reaction)}
                style={styles.reactionOption}
              >
                <Text style={styles.reactionOptionIcon}>{getReactionIcon(reaction)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
        contentContainerStyle={styles.listContent}
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
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 8,
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerAvatar: {
    backgroundColor: '#1877f2',
  },
  postInput: {
    flex: 1,
    marginLeft: 10,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  postInputText: {
    color: '#65676b',
    fontSize: 16,
  },
  headerDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: '#e4e6eb',
  },
  card: {
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
  avatar: {
    backgroundColor: '#1877f2',
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
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
    height: 250,
    borderRadius: 0,
    marginTop: 0,
    backgroundColor: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reactionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#65676b',
  },
  actionsDivider: {
    height: 1,
    backgroundColor: '#e4e6eb',
    marginHorizontal: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    position: 'relative',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
    color: '#65676b',
  },
  actionText: {
    fontSize: 15,
    color: '#65676b',
    fontWeight: '500',
  },
  reactionMenu: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  reactionOption: {
    padding: 6,
    marginHorizontal: 2,
  },
  reactionOptionIcon: {
    fontSize: 24,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#65676b',
    fontSize: 16,
  },
});

export default HomeScreen;
