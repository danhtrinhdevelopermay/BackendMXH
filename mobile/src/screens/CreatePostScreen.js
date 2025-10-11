import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Avatar, Text, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { postAPI, uploadAPI } from '../api/api';
import { AuthContext } from '../context/AuthContext';

const CreatePostScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!content && !imageUri) {
      Alert.alert('Error', 'Please add some content or an image');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        const uploadResponse = await uploadAPI.uploadImage(imageUri);
        imageUrl = uploadResponse.url;
      }

      await postAPI.createPost({ content, image_url: imageUrl });
      Alert.alert('Success', 'Post created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create post');
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
          <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        </View>
      </View>
      
      <Divider />
      
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
          numberOfLines={6}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addPhotoButton}
          onPress={pickImage}
        >
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.addPhotoText}>
            {imageUri ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>
        
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={loading}
          disabled={loading || (!content && !imageUri)}
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
  userName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
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
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    marginBottom: 12,
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
