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
          <View style={styles.storyCard}>
            {story.thumbnail_url || story.media_url ? (
              <>
                <Image
                  source={{ uri: story.thumbnail_url || story.media_url }}
                  style={styles.storyCardImage}
                  resizeMode="cover"
                />
                <View style={styles.storyCardOverlay} />
                <View style={styles.storyCardUserAvatar}>
                  {story.avatar_url ? (
                    <Image
                      source={{ uri: story.avatar_url }}
                      style={styles.storyCardUserAvatarImage}
                    />
                  ) : (
                    <View style={styles.storyCardUserAvatarPlaceholder}>
                      <Text style={styles.storyCardAvatarInitial}>
                        {(story.full_name || story.username || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.storyCardName} numberOfLines={1}>
                  {story.full_name || story.username}
                </Text>
              </>
            ) : (
              <View style={styles.storyCardEmpty}>
                <UserAvatar 
                  user={story}
                  userId={story.user_id}
                  size={56}
                />
              </View>
            )}
          </View>
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
  storyCard: {
    width: 110,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
    position: 'relative',
  },
  storyCardImage: {
    width: '100%',
    height: '100%',
  },
  storyCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  storyCardUserAvatar: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
  },
  storyCardUserAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  storyCardUserAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCardAvatarInitial: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  storyCardName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    zIndex: 10,
  },
  storyCardEmpty: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StoriesBar;
