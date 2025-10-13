import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from './UserAvatar';

const StoriesBar = ({ stories, currentUserId, onCreateStory, onViewStory }) => {
  const hasOwnStory = stories.some(s => s.user_id === currentUserId);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity 
        style={styles.storyItem} 
        onPress={onCreateStory}
        activeOpacity={0.7}
      >
        <View style={styles.createStoryContainer}>
          {hasOwnStory ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.storyRing}
            >
              <View style={styles.avatarContainer}>
                <UserAvatar userId={currentUserId} size={56} />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.createAvatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="#9CA3AF" />
              </View>
              <View style={styles.addButton}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </LinearGradient>
              </View>
            </View>
          )}
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {hasOwnStory ? 'Story của bạn' : 'Tạo story'}
        </Text>
      </TouchableOpacity>

      {stories
        .filter(story => story.user_id !== currentUserId)
        .map((story) => (
          <TouchableOpacity
            key={story.user_id}
            style={styles.storyItem}
            onPress={() => onViewStory(story.user_id)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.storyRing}
            >
              <View style={styles.avatarContainer}>
                <UserAvatar 
                  user={story}
                  userId={story.user_id}
                  size={56}
                />
              </View>
            </LinearGradient>
            <Text style={styles.storyName} numberOfLines={1}>
              {story.full_name || story.username}
            </Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 8,
    borderBottomColor: '#f0f2f5',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  createStoryContainer: {
    marginBottom: 8,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  createAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  addButtonGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyName: {
    fontSize: 12,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StoriesBar;
