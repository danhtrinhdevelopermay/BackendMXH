import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button, Text, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { authAPI } from '../api/api';
import Constants from 'expo-constants';

const EditProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [coverUri, setCoverUri] = useState(null);

  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  const pickImage = async (type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showAlert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện ảnh', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'avatar') {
        setAvatarUri(result.assets[0].uri);
      } else {
        setCoverUri(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (avatarUri) {
        await authAPI.uploadAvatar(avatarUri);
      }

      if (coverUri) {
        await authAPI.uploadCover(coverUri);
      }

      await authAPI.updateProfile({
        full_name: fullName,
        bio: bio,
      });

      await refreshUser();

      showAlert('Thành công', 'Đã cập nhật thông tin cá nhân', 'success', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      showAlert('Lỗi', 'Không thể cập nhật thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSource = () => {
    if (avatarUri) {
      return { uri: avatarUri };
    }
    if (user?.id) {
      return { uri: `${API_URL}/api/avatar/${user.id}` };
    }
    return null;
  };

  const getCoverSource = () => {
    if (coverUri) {
      return { uri: coverUri };
    }
    if (user?.id) {
      return { uri: `${API_URL}/api/cover/${user.id}` };
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.coverSection}>
        <TouchableOpacity onPress={() => pickImage('cover')} style={styles.coverContainer}>
          {getCoverSource() ? (
            <Image source={getCoverSource()} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, styles.coverPlaceholder]}>
              <Text style={styles.placeholderText}>Chọn ảnh bìa</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => pickImage('avatar')} style={styles.avatarContainer}>
          {getAvatarSource() ? (
            <Image source={getAvatarSource()} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={120}
              label={user?.username?.[0]?.toUpperCase() || 'U'}
              style={styles.avatar}
            />
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraText}>📷</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <TextInput
          label="Tên đầy đủ"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Tiểu sử"
          value={bio}
          onChangeText={setBio}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
          buttonColor="#1877f2"
        >
          Lưu thay đổi
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  coverSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  coverContainer: {
    height: 200,
    backgroundColor: '#e4e6eb',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1877f2',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: -60,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e4e6eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraText: {
    fontSize: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default EditProfileScreen;
