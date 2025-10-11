import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Avatar, Text, Divider, Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { postAPI, uploadAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';

const CreatePostScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [privacyMenuVisible, setPrivacyMenuVisible] = useState(false);

  const pickMedia = async (type = 'all') => {
    const mediaTypeOption = type === 'video' 
      ? ImagePicker.MediaTypeOptions.Videos 
      : ImagePicker.MediaTypeOptions.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypeOption,
      allowsEditing: type !== 'video',
      aspect: [16, 9],
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type);
    }
  };

  const handleCreatePost = async () => {
    if (!content && !mediaUri) {
      showAlert('Error', 'Please add some content or media', 'error');
      return;
    }

    setLoading(true);
    try {
      let mediaId = null;
      if (mediaUri) {
        const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
        const uploadResponse = await uploadAPI.uploadMedia(mediaUri, mimeType);
        mediaId = uploadResponse.id;
      }

      await postAPI.createPost({ content, media_id: mediaId, privacy });
      showAlert('Success', 'Post created successfully', 'success');
      navigation.goBack();
    } catch (error) {
      showAlert('Error', error.response?.data?.error || 'Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={40} 
            label={user?.username?.[0]?.toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
            <Menu
              visible={privacyMenuVisible}
              onDismiss={() => setPrivacyMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.privacyButton}
                  onPress={() => setPrivacyMenuVisible(true)}
                >
                  <Ionicons 
                    name={privacy === 'public' ? 'globe-outline' : 'people-outline'} 
                    size={14} 
                    color="#65676b" 
                  />
                  <Text style={styles.privacyText}>
                    {privacy === 'public' ? 'Công khai' : 'Bạn bè'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#65676b" />
                </TouchableOpacity>
              }
            >
              <Menu.Item 
                onPress={() => {
                  setPrivacy('public');
                  setPrivacyMenuVisible(false);
                }}
                title="Công khai"
                leadingIcon="globe-outline"
              />
              <Menu.Item 
                onPress={() => {
                  setPrivacy('friends');
                  setPrivacyMenuVisible(false);
                }}
                title="Bạn bè"
                leadingIcon="people-outline"
              />
            </Menu>
          </View>
        </View>
      </View>
      
      <Divider />
      
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          placeholder="Hôm nay bạn như thế nào?"
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
          numberOfLines={6}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        
        {mediaUri && (
          <View style={styles.imageContainer}>
            {mediaType === 'video' ? (
              <Video
                source={{ uri: mediaUri }}
                style={styles.image}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.image} />
            )}
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => {
                setMediaUri(null);
                setMediaType(null);
              }}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.mediaButtons}>
          <TouchableOpacity 
            style={[styles.addPhotoButton, { flex: 1, marginRight: 8 }]}
            onPress={() => pickMedia('image')}
          >
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addPhotoButton, { flex: 1 }]}
            onPress={() => pickMedia('video')}
          >
            <Text style={styles.photoIcon}>🎥</Text>
            <Text style={styles.addPhotoText}>Video</Text>
          </TouchableOpacity>
        </View>
        
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={loading}
          disabled={loading || (!content && !mediaUri)}
          style={styles.postButton}
          buttonColor="#1877f2"
        >
          Post
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#1877f2',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: 12,
    color: '#65676b',
    marginLeft: 4,
    marginRight: 2,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  input: {
    fontSize: 18,
    backgroundColor: '#fff',
    minHeight: 150,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
  },
  mediaButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
  },
  photoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#050505',
    fontWeight: '500',
  },
  postButton: {
    borderRadius: 8,
    paddingVertical: 4,
  },
});

export default CreatePostScreen;
