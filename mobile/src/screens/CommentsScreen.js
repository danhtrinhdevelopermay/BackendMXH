import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, IconButton, Avatar, Text, Card } from 'react-native-paper';
import { commentAPI } from '../api/api';

const CommentsScreen = ({ route }) => {
  const { postId } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments(postId);
      setComments(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch comments');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await commentAPI.addComment(postId, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const renderComment = ({ item }) => (
    <Card style={styles.commentCard} elevation={0}>
      <View style={styles.commentContainer}>
        <Avatar.Text 
          size={40} 
          label={item.username?.[0]?.toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{item.full_name || item.username}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
          <Text style={styles.commentTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          </View>
        }
        contentContainerStyle={styles.commentsList}
      />
      <View style={styles.inputContainer}>
        <Avatar.Text 
          size={32} 
          label="U"
          style={styles.inputAvatar}
        />
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          style={styles.input}
          mode="outlined"
          outlineColor="transparent"
          activeOutlineColor="#1877f2"
          multiline
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleAddComment}
          disabled={loading || !newComment.trim()}
          iconColor="#1877f2"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  commentsList: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  commentCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 0,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    backgroundColor: '#1877f2',
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
  },
  commentBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#65676b',
    marginTop: 4,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    alignItems: 'center',
  },
  inputAvatar: {
    backgroundColor: '#1877f2',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default CommentsScreen;
