import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storyAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

const ViewStoryScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const progressAnims = useRef([]);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgress();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, stories]);

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getUserStories(userId);
      setStories(response.data);
      progressAnims.current = response.data.map(() => new Animated.Value(0));
    } catch (error) {
      console.error('Fetch stories error:', error);
      showAlert('Lỗi', 'Không thể tải stories', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startProgress = () => {
    const duration = stories[currentIndex]?.media_type === 'video' ? 30000 : 5000;
    
    progressAnims.current[currentIndex].setValue(0);
    Animated.timing(progressAnims.current[currentIndex], {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    if (stories[currentIndex]?.media_type !== 'video') {
      timerRef.current = setTimeout(handleNext, duration);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      progressAnims.current[currentIndex].setValue(0);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Deleting story:', stories[currentIndex].id);
      console.log('Current user ID:', user?.id);
      console.log('Story user ID:', stories[currentIndex].user_id);
      
      await storyAPI.deleteStory(stories[currentIndex].id);
      const newStories = stories.filter((_, i) => i !== currentIndex);
      if (newStories.length === 0) {
        navigation.goBack();
      } else {
        setStories(newStories);
        progressAnims.current = newStories.map(() => new Animated.Value(0));
        if (currentIndex >= newStories.length) {
          setCurrentIndex(newStories.length - 1);
        }
      }
      showAlert('Thành công', 'Đã xóa story', 'success');
    } catch (error) {
      console.error('Delete story error:', error);
      console.error('Error response:', error.response?.data);
      showAlert('Lỗi', error.response?.data?.error || 'Không thể xóa story', 'error');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diff = Math.floor((now - created) / 1000 / 60);
    if (diff < 60) return `${diff}p`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  if (loading || stories.length === 0) {
    return <View style={styles.container} />;
  }

  const currentStory = stories[currentIndex];
  const isOwnStory = parseInt(currentStory.user_id) === parseInt(user?.id);

  return (
    <View style={styles.container}>
      {currentStory.media_type === 'video' ? (
        <Video
          ref={videoRef}
          source={{ uri: currentStory.media_url }}
          style={styles.media}
          resizeMode="contain"
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              handleNext();
            }
          }}
        />
      ) : (
        <Image 
          source={{ uri: currentStory.media_url }} 
          style={styles.media}
          resizeMode="contain"
        />
      )}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnims.current[index]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) || '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.userInfo}>
          <UserAvatar user={currentStory} userId={currentStory.user_id} size={48} />
          <View style={styles.userText}>
            <Text style={styles.userName}>{currentStory.full_name || currentStory.username}</Text>
            <Text style={styles.timeText}>{formatTime(currentStory.created_at)}</Text>
          </View>
          
          <View style={styles.headerActions}>
            {isOwnStory && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {currentStory.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{currentStory.caption}</Text>
        </View>
      )}

      <View style={styles.touchAreas}>
        <TouchableOpacity style={styles.touchLeft} onPress={handlePrevious} />
        <TouchableOpacity style={styles.touchRight} onPress={handleNext} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  media: {
    width,
    height,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  timeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  caption: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  touchAreas: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 1,
  },
});

export default ViewStoryScreen;
