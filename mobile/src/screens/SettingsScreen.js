import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { messageBackupAPI } from '../api/api';
import MessageStorageService from '../services/MessageStorageService';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupMetadata, setBackupMetadata] = useState(null);
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    navigation.setOptions({ 
      headerShown: false
    });
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    try {
      const metadata = await MessageStorageService.getBackupMetadata();
      setBackupMetadata(metadata);

      const stats = await MessageStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  };

  const handleBackup = async () => {
    Alert.alert(
      'Sao lưu tin nhắn',
      'Bạn có muốn sao lưu toàn bộ tin nhắn lên Google Drive không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Sao lưu', 
          onPress: async () => {
            setLoading(true);
            try {
              const backupData = await MessageStorageService.exportAllMessages();
              
              if (!backupData) {
                throw new Error('Không thể tạo file backup');
              }

              const response = await messageBackupAPI.createBackup(backupData);
              
              if (response.data.success) {
                await MessageStorageService.saveBackupMetadata({
                  lastBackup: new Date().toISOString(),
                  backupFileId: response.data.backup.fileId,
                  backupFileName: response.data.backup.fileName
                });

                showAlert('Thành công', 'Tin nhắn đã được sao lưu lên Google Drive', 'success');
                loadBackupInfo();
              }
            } catch (error) {
              console.error('Backup error:', error);
              showAlert('Lỗi', 'Không thể sao lưu tin nhắn: ' + error.message, 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleListBackups = async () => {
    setLoading(true);
    try {
      const response = await messageBackupAPI.listBackups();
      
      if (response.data.success) {
        setBackups(response.data.backups);
        
        if (response.data.backups.length === 0) {
          showAlert('Thông báo', 'Bạn chưa có bản sao lưu nào trên Google Drive', 'info');
        } else {
          navigation.navigate('BackupList', { backups: response.data.backups });
        }
      }
    } catch (error) {
      console.error('List backups error:', error);
      showAlert('Lỗi', 'Không thể tải danh sách backup: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const response = await messageBackupAPI.listBackups();
      
      if (response.data.success && response.data.backups.length > 0) {
        const latestBackup = response.data.backups[0];
        
        Alert.alert(
          'Khôi phục tin nhắn',
          `Bạn có muốn khôi phục tin nhắn từ file "${latestBackup.name}"?\n\nLưu ý: Toàn bộ tin nhắn hiện tại trên điện thoại sẽ bị xóa và thay thế bằng tin nhắn từ backup.`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Khôi phục', 
              style: 'destructive',
              onPress: async () => {
                try {
                  const restoreResponse = await messageBackupAPI.restoreBackup(latestBackup.id);
                  
                  if (restoreResponse.data.success) {
                    const result = await MessageStorageService.importMessages(restoreResponse.data.backup);
                    
                    if (result.success) {
                      showAlert(
                        'Thành công', 
                        `Đã khôi phục ${result.conversationsRestored} cuộc trò chuyện từ backup`, 
                        'success'
                      );
                      loadBackupInfo();
                    } else {
                      throw new Error(result.error || 'Không thể import tin nhắn');
                    }
                  }
                } catch (restoreError) {
                  console.error('Restore error:', restoreError);
                  showAlert('Lỗi', 'Không thể khôi phục tin nhắn: ' + restoreError.message, 'error');
                } finally {
                  setLoading(false);
                }
              }
            }
          ]
        );
      } else {
        showAlert('Thông báo', 'Bạn chưa có bản sao lưu nào trên Google Drive', 'info');
        setLoading(false);
      }
    } catch (error) {
      console.error('Restore check error:', error);
      showAlert('Lỗi', 'Không thể kiểm tra backup: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={24} color={danger ? '#FF3B30' : '#0084FF'} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#050505" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sao lưu & Khôi phục</Text>
          
          {storageStats && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Thông tin lưu trữ</Text>
              <Text style={styles.infoText}>Tổng số cuộc trò chuyện: {storageStats.totalConversations}</Text>
              <Text style={styles.infoText}>Tổng số tin nhắn: {storageStats.totalMessages}</Text>
              {backupMetadata?.lastBackup && (
                <Text style={styles.infoText}>
                  Sao lưu lần cuối: {formatDate(backupMetadata.lastBackup)}
                </Text>
              )}
              {backupMetadata?.lastRestore && (
                <Text style={styles.infoText}>
                  Khôi phục lần cuối: {formatDate(backupMetadata.lastRestore)}
                </Text>
              )}
            </View>
          )}
          
          <SettingItem
            icon="cloud-upload-outline"
            title="Sao lưu tin nhắn"
            subtitle="Sao lưu toàn bộ tin nhắn lên Google Drive"
            onPress={handleBackup}
          />
          <SettingItem
            icon="cloud-download-outline"
            title="Khôi phục tin nhắn"
            subtitle="Khôi phục tin nhắn từ Google Drive"
            onPress={handleRestore}
          />
          <SettingItem
            icon="list-outline"
            title="Danh sách backup"
            subtitle="Xem và quản lý các bản sao lưu"
            onPress={handleListBackups}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <SettingItem
            icon="person-outline"
            title="Thông tin cá nhân"
            subtitle={user?.full_name || user?.username}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Bảo mật tài khoản với mã OTP"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingItem
            icon="log-out-outline"
            title="Đăng xuất"
            onPress={() => {
              Alert.alert(
                'Đăng xuất',
                'Bạn có chắc chắn muốn đăng xuất?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Đăng xuất', style: 'destructive', onPress: logout }
                ]
              );
            }}
            danger
            showArrow={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 Zalo Clone</Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0084FF" />
          <Text style={styles.loadingText}>Đang xử lý...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050505',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#65676B',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#65676B',
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#050505',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#65676B',
    marginTop: 2,
  },
  dangerText: {
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#65676B',
    marginBottom: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default SettingsScreen;
