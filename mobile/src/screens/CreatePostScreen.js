import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { postAPI, uploadAPI } from '../api/api';

const CreatePostScreen = ({ navigation }) => {
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
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        label="What's on your mind?"
        value={content}
        onChangeText={setContent}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={5}
      />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.button}
        icon="image"
      >
        {imageUri ? 'Change Image' : 'Pick Image'}
      </Button>
      <Button
        mode="contained"
        onPress={handleCreatePost}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Create Post
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    marginBottom: 10,
  },
});

export default CreatePostScreen;
