import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Avatar, Text, IconButton } from 'react-native-paper';
import { notificationAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';

const NotificationsScreen = () => {
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      if (response && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.log('Failed to fetch notifications:', error?.message || error);
      setNotifications([]);
      if (!loading) {
        showAlert('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      showAlert('Lỗi', 'Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      showAlert('Lỗi', 'Không thể đánh dấu tất cả đã đọc', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request': return 'account-plus';
      case 'friend_accept': return 'account-check';
      case 'comment': return 'comment';
      case 'reaction': return 'heart';
      case 'message': return 'message';
      case 'message_reaction': return 'emoticon-happy';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accept':
        return '#1877f2';
      case 'comment':
        return '#65c368';
      case 'reaction':
        return '#f33e58';
      case 'message':
      case 'message_reaction':
        return '#9b59b6';
      default:
        return '#65676b';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
    return `${Math.floor(diffInSeconds / 604800)} tuần`;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
      onPress={() => handleMarkAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <UserAvatar 
          user={{
            id: item.related_user_id,
            user_id: item.related_user_id,
            username: item.username,
            full_name: item.full_name,
            avatar_url: item.avatar_url
          }}
          size={56}
        />
        <View style={[styles.iconBadge, { backgroundColor: getNotificationColor(item.type) }]}>
          <IconButton
            icon={getNotificationIcon(item.type)}
            size={16}
            iconColor="#fff"
            style={styles.badgeIcon}
          />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>
          <Text style={styles.username}>{item.username || 'Ai đó'}</Text>{' '}
          <Text style={styles.message}>{item.content}</Text>
        </Text>
        <Text style={styles.timeText}>{getTimeAgo(item.created_at)}</Text>
      </View>

      {!item.is_read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo đến</Text>
        {notifications && notifications.length > 0 && notifications.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Đánh dấu đã đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1877f2']}
            tintColor="#1877f2"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton
              icon="bell-outline"
              size={64}
              iconColor="#bcc0c4"
            />
            <Text style={styles.emptyText}>Chưa có thông báo</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#050505',
  },
  markAllButton: {
    fontSize: 15,
    color: '#1877f2',
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  unreadItem: {
    backgroundColor: '#e7f3ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeIcon: {
    margin: 0,
    padding: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#050505',
  },
  username: {
    fontWeight: '600',
    color: '#050505',
  },
  message: {
    color: '#050505',
  },
  timeText: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1877f2',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 17,
    color: '#65676b',
    marginTop: 12,
  },
});

export default NotificationsScreen;
