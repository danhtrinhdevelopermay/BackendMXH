import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useAlert } from '../context/AlertContext';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const ViewAvatarScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { showAlert } = useAlert();
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
  const avatarUrl = `${API_URL}/api/avatar/${userId}?${Date.now()}`;

  const handleSaveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh', 'warning');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `avatar_${userId}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(avatarUrl, fileUri);
      
      if (downloadResult.status === 200) {
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('Shatter', asset, false);
        showAlert('Thành công', 'Đã lưu ảnh vào thư viện', 'success');
      } else {
        showAlert('Lỗi', 'Không thể tải ảnh', 'error');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showAlert('Lỗi', 'Không thể lưu ảnh', 'error');
    }
  };

  const handleShareImage = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showAlert('Thông báo', 'Chức năng chia sẻ không khả dụng trên thiết bị này', 'warning');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `avatar_${userId}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(avatarUrl, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: `Chia sẻ ảnh của ${userName}`,
        });
      } else {
        showAlert('Lỗi', 'Không thể tải ảnh để chia sẻ', 'error');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      showAlert('Lỗi', 'Không thể chia sẻ ảnh', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Blur */}
      <Image
        source={{ uri: avatarUrl }}
        style={styles.backgroundImage}
        blurRadius={50}
      />
      <BlurView intensity={80} style={styles.blurOverlay} tint="dark" />

      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Avatar Image */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSaveImage}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="download" size={28} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Lưu ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShareImage}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="share-social" size={28} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  blurOverlay: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 22,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    borderWidth: 4,
    borderColor: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    gap: 50,
  },
  actionButton: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ViewAvatarScreen;
