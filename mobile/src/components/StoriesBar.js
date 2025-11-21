import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from './UserAvatar';

const StoriesBar = ({ stories, currentUserId, onCreateStory, onViewStory }) => {
  const hasOwnStory = stories.some(s => s.user_id === currentUserId);
  const ownStories = stories.filter(s => s.user_id === currentUserId);
  const otherStories = stories.filter(s => s.user_id !== currentUserId);

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
          <View style={styles.createAvatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color="#9CA3AF" />
            </View>
            <View style={styles.addButton}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </LinearGradient>
            </View>
          </View>
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          Tạo story
        </Text>
      </TouchableOpacity>

      {hasOwnStory && ownStories.map((story) => (
        <TouchableOpacity
          key={`own-${story.user_id}`}
          style={styles.storyItem}
          onPress={() => onViewStory(story.user_id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.storyRing}
          >
            <View style={styles.avatarContainer}>
              {story.thumbnail_url || story.media_url ? (
                <Image
                  source={{ uri: story.thumbnail_url || story.media_url }}
                  style={styles.storyThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <UserAvatar 
                  user={story}
                  userId={story.user_id}
                  size={56}
                />
              )}
            </View>
          </LinearGradient>
          <Text style={styles.storyName} numberOfLines={1}>
            Story của bạn
          </Text>
        </TouchableOpacity>
      ))}

      {otherStories.map((story) => (
        <TouchableOpacity
          key={story.user_id}
          style={styles.storyItem}
          onPress={() => onViewStory(story.user_id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.storyRing}
          >
            <View style={styles.avatarContainer}>
              {story.thumbnail_url || story.media_url ? (
                <>
                  <Image
                    source={{ uri: story.thumbnail_url || story.media_url }}
                    style={styles.storyThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.userAvatarBadge}>
                    {story.avatar_url ? (
                      <Image
                        source={{ uri: story.avatar_url }}
                        style={styles.userAvatarImage}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(story.full_name || story.username || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <UserAvatar 
                  user={story}
                  userId={story.user_id}
                  size={56}
                />
              )}
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
  storyThumbnail: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  userAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#f0f2f5',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  userAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default StoriesBar;
