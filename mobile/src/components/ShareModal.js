import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Modal, Portal, Text, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';
import Constants from 'expo-constants';
import { friendshipAPI, messageAPI } from '../api/api';
import UserAvatar from './UserAvatar';

const ShareModal = ({ visible, onDismiss, post }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    if (visible && post) {
      fetchFriends();
    }
  }, [visible, post]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await friendshipAPI.getFriends();
      console.log('Friends response:', response.data);
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const getPostUrl = () => {
    if (!post) return '';
    const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
    return `${API_URL}/post/${post.id}`;
  };

  const getMediaUrl = () => {
    if (!post || !post.media_url) return null;
    const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
    return post.media_url.startsWith('http') ? post.media_url : `${API_URL}${post.media_url}`;
  };

  const handleShareLink = async () => {
    if (!post) return;
    try {
      const postUrl = getPostUrl();
      const message = post.content 
        ? `${post.content}\n\n${postUrl}` 
        : postUrl;

      await Share.share({
        message,
        url: postUrl,
        title: 'Chia sẻ bài viết',
      });
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ link');
    }
  };

  const handleDownloadMedia = async () => {
    if (!post) return;
    try {
      const mediaUrl = getMediaUrl();
      if (!mediaUrl) {
        Alert.alert('Thông báo', 'Bài viết không có media để tải');
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập', 
          'Expo Go không hỗ trợ đầy đủ quyền media library. Vui lòng build ứng dụng để sử dụng tính năng này hoặc dùng "Chia sẻ link".',
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);

      const isVideo = post.media_type?.startsWith('video/');
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const localUri = `${FileSystem.documentDirectory}download_${Date.now()}${fileExtension}`;

      const { uri } = await FileSystem.downloadAsync(mediaUrl, localUri);
      const asset = await MediaLibrary.createAssetAsync(uri);

      const album = await MediaLibrary.getAlbumAsync('Shatter');
      if (album === null) {
        await MediaLibrary.createAlbumAsync('Shatter', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Thành công', 'Đã lưu media vào thư viện trong album Shatter');
      onDismiss();
    } catch (error) {
      console.error('Error downloading media:', error);
      Alert.alert(
        'Lỗi', 
        `Không thể tải xuống: ${error.message}. Tính năng này hoạt động tốt nhất trên ứng dụng đã build.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShareMedia = async () => {
    if (!post) return;
    try {
      const mediaUrl = getMediaUrl();
      if (!mediaUrl) {
        Alert.alert('Thông báo', 'Bài viết không có media để chia sẻ');
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          'Không khả dụng', 
          'Chia sẻ media không hoạt động trên Expo Go. Vui lòng sử dụng "Chia sẻ link" hoặc build ứng dụng để sử dụng đầy đủ tính năng.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);

      const isVideo = post.media_type?.startsWith('video/');
      const fileExtension = isVideo ? '.mp4' : '.jpg';
      const localUri = `${FileSystem.cacheDirectory}share_${Date.now()}${fileExtension}`;

      const { uri } = await FileSystem.downloadAsync(mediaUrl, localUri);

      await Sharing.shareAsync(uri, {
        mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
        dialogTitle: 'Chia sẻ media',
        UTI: isVideo ? 'public.movie' : 'public.image',
      });

      Alert.alert('Thành công', 'Đã chia sẻ media');
      onDismiss();
    } catch (error) {
      console.error('Error sharing media:', error);
      Alert.alert(
        'Lỗi', 
        `Không thể chia sẻ media: ${error.message}. Hãy thử "Chia sẻ link" thay thế.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendToFriends = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một người bạn');
      return;
    }

    try {
      setLoading(true);
      const postUrl = getPostUrl();
      const messageContent = post.content 
        ? `📮 Chia sẻ bài viết:\n${post.content}\n\n${postUrl}`
        : `📮 Chia sẻ bài viết: ${postUrl}`;

      const sendPromises = selectedFriends.map(friendId =>
        messageAPI.sendMessage({
          receiver_id: friendId,
          content: messageContent
        })
      );

      await Promise.all(sendPromises);

      Alert.alert(
        'Thành công',
        `Đã gửi bài viết đến ${selectedFriends.length} người bạn`,
        [{ text: 'OK', onPress: onDismiss }]
      );
      setSelectedFriends([]);
    } catch (error) {
      console.error('Error sending to friends:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn đến bạn bè');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!post) return null;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Chia sẻ bài viết</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tùy chọn chia sẻ</Text>
            
            <TouchableOpacity style={styles.option} onPress={handleShareLink}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.optionIcon}
              >
                <Ionicons name="link" size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Chia sẻ link</Text>
                <Text style={styles.optionDesc}>Chia sẻ link bài viết đến ứng dụng khác</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {post.media_url && (
              <>
                <TouchableOpacity style={styles.option} onPress={handleShareMedia}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    style={styles.optionIcon}
                  >
                    <Ionicons name="share-social" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Chia sẻ media</Text>
                    <Text style={styles.optionDesc}>Chia sẻ ảnh/video đến ứng dụng khác</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleDownloadMedia}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.optionIcon}
                  >
                    <Ionicons name="download" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Tải xuống</Text>
                    <Text style={styles.optionDesc}>Lưu ảnh/video vào thư viện</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gửi đến bạn bè</Text>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm bạn bè..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {filteredFriends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendItem}
                    onPress={() => toggleFriendSelection(friend.id)}
                  >
                    <UserAvatar user={friend} size={40} />
                    <Text style={styles.friendName}>{friend.full_name || friend.username}</Text>
                    <View style={styles.checkbox}>
                      {selectedFriends.includes(friend.id) && (
                        <LinearGradient
                          colors={['#FF6B35', '#F7931E']}
                          style={styles.checkboxFilled}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </LinearGradient>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                {!loading && filteredFriends.length === 0 && friends.length === 0 && (
                  <Text style={styles.emptyText}>Bạn chưa có bạn bè nào</Text>
                )}
                {!loading && filteredFriends.length === 0 && friends.length > 0 && (
                  <Text style={styles.emptyText}>Không tìm thấy bạn bè</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {selectedFriends.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSendToFriends} disabled={loading}>
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.sendButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.sendButtonText}>
                      Gửi đến {selectedFriends.length} người
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  optionDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 8,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1f2937',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  friendsList: {
    gap: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  friendName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ShareModal;
