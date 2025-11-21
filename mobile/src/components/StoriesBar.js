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
                  Story của bạn
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  storyItem: {
    alignItems: 'center',
  },
  createStoryContainer: {
    marginBottom: 0,
  },
  storyRing: {
    width: 100,
    height: 160,
    borderRadius: 16,
    padding: 0,
    marginBottom: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 8,
    paddingLeft: 8,
  },
  createAvatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: -5,
    right: 15,
  },
  addButtonGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyName: {
    fontSize: 11,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '500',
    width: 100,
  },
  storyCard: {
    width: 100,
    height: 160,
    borderRadius: 16,
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  storyCardUserAvatar: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 10,
  },
  storyCardUserAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  storyCardUserAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCardAvatarInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  storyCardName: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    fontSize: 11,
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
