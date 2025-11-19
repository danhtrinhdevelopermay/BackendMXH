import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

const UpdateModal = ({ visible, updateInfo, onUpdateLater }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  console.log('🎨 UpdateModal render:', { visible, hasUpdateInfo: !!updateInfo });

  const handleDownloadAndInstall = async () => {
    console.log('🔽 Download button pressed', Platform.OS);
    
    if (Platform.OS !== 'android') {
      Alert.alert('Thông báo', 'Tính năng này chỉ hỗ trợ Android');
      return;
    }

    const apkUrl = updateInfo.apkUrl.startsWith('http://') || updateInfo.apkUrl.startsWith('https://') 
      ? updateInfo.apkUrl 
      : `${API_URL}${updateInfo.apkUrl}`;

    if (Constants.appOwnership === 'expo') {
      Alert.alert(
        'Tải APK',
        'Bạn đang dùng Expo Go. Vui lòng tải APK bằng trình duyệt.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Mở trình duyệt',
            onPress: () => {
              console.log('🌐 Opening browser:', apkUrl);
              Linking.openURL(apkUrl).catch(err => {
                console.error('Error opening URL:', err);
                Alert.alert('Lỗi', 'Không thể mở trình duyệt');
              });
            }
          }
        ]
      );
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const fileName = `shatter-${updateInfo.versionName}.apk`;
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log('📥 Downloading APK from:', apkUrl);

      const downloadResumable = FileSystem.createDownloadResumable(
        apkUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(Math.round(progress * 100));
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      console.log('✅ APK downloaded to:', uri);
      setDownloading(false);

      const contentUri = await FileSystem.getContentUriAsync(uri);
      
      console.log('📱 Installing APK...');

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: 'application/vnd.android.package-archive',
      });

    } catch (error) {
      console.error('❌ Error downloading/installing APK:', error);
      setDownloading(false);
      setDownloadProgress(0);
      Alert.alert(
        'Lỗi',
        'Không thể tải xuống: ' + error.message,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={updateInfo.isForceUpdate ? null : onUpdateLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎉</Text>
          </View>

          <Text style={styles.title}>Cập Nhật Mới</Text>
          <Text style={styles.versionText}>Phiên bản {updateInfo.versionName}</Text>

          {updateInfo.isForceUpdate && (
            <View style={styles.forceBadge}>
              <Text style={styles.forceText}>⚠️ Bắt buộc cập nhật</Text>
            </View>
          )}

          {updateInfo.releaseNotes && (
            <View style={styles.releaseNotesContainer}>
              <Text style={styles.releaseNotesTitle}>📝 Nội dung cập nhật:</Text>
              <Text style={styles.releaseNotes}>{updateInfo.releaseNotes}</Text>
            </View>
          )}

          <View style={styles.sizeInfo}>
            <Text style={styles.sizeText}>
              📦 Kích thước: {(updateInfo.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>

          {downloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.downloadingText}>
                Đang tải xuống... {downloadProgress}%
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
              </View>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleDownloadAndInstall}
              >
                <Text style={styles.updateButtonText}>⬇️ Tải và Cập Nhật</Text>
              </TouchableOpacity>

              {!updateInfo.isForceUpdate && (
                <TouchableOpacity
                  style={styles.laterButton}
                  onPress={onUpdateLater}
                >
                  <Text style={styles.laterButtonText}>Để sau</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 15,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  forceBadge: {
    backgroundColor: '#ff5252',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  forceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  releaseNotesContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginBottom: 15,
  },
  releaseNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  sizeInfo: {
    marginBottom: 20,
  },
  sizeText: {
    fontSize: 13,
    color: '#999',
  },
  downloadingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  downloadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  buttonsContainer: {
    width: '100%',
  },
  updateButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateModal;
