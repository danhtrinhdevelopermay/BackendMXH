import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storyAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';

const CreateStoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const pickMedia = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: type === 'video' ? 0.8 : 0.9,
      videoMaxDuration: 30,
    });

    if (!result.canceled) {
      setMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type || type);
    }
  };

  const handleShare = async () => {
    if (!media) {
      showAlert('Lỗi', 'Vui lòng chọn ảnh hoặc video', 'error');
      return;
    }

    setLoading(true);
    try {
      await storyAPI.createStory(media, mediaType, caption);
      showAlert('Thành công', 'Đã đăng story', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Create story error:', error);
      showAlert('Lỗi', 'Không thể đăng story', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo story</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {media ? (
          <View style={styles.mediaPreview}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: media }}
                style={styles.media}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            ) : (
              <Image source={{ uri: media }} style={styles.media} resizeMode="contain" />
            )}
            
            <View style={styles.captionContainer}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Thêm chú thích..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={styles.captionInput}
                multiline
              />
            </View>

            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
              disabled={loading}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.shareGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.shareText}>Chia sẻ</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chọn ảnh hoặc video</Text>
            <Text style={styles.emptyText}>Chia sẻ khoảnh khắc của bạn với bạn bè</Text>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.pickButton}
                onPress={() => pickMedia('image')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.pickGradient}
                >
                  <Ionicons name="image" size={32} color="#fff" />
                  <Text style={styles.pickText}>Chọn ảnh</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.pickButton}
                onPress={() => pickMedia('video')}
              >
                <LinearGradient
                  colors={['#764ba2', '#667eea']}
                  style={styles.pickGradient}
                >
                  <Ionicons name="videocam" size={32} color="#fff" />
                  <Text style={styles.pickText}>Chọn video</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  pickButton: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pickGradient: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  mediaPreview: {
    flex: 1,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  captionInput: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  shareButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CreateStoryScreen;
