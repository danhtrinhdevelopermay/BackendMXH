import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, IconButton, List, Avatar, Text } from 'react-native-paper';
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
    <List.Item
      title={item.full_name || item.username}
      description={item.content}
      left={(props) => <Avatar.Text {...props} size={40} label={item.username?.[0]?.toUpperCase() || 'U'} />}
    />
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
        ListEmptyComponent={<Text style={styles.empty}>No comments yet. Be the first to comment!</Text>}
        contentContainerStyle={styles.commentsList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          style={styles.input}
          mode="outlined"
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleAddComment}
          disabled={loading || !newComment.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsList: {
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default CommentsScreen;
