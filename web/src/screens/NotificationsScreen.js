import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Avatar, Text, IconButton } from 'react-native-paper';
import { notificationAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';

const NotificationsScreen = () => {
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải thông báo', 'error');
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
      showAlert('Thành công', 'Đã đánh dấu tất cả là đã đọc', 'success');
    } catch (error) {
      showAlert('Lỗi', 'Không thể đánh dấu tất cả đã đọc', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request': return 'account-plus';
      case 'friend_accept': return 'account-check';
      case 'comment': return 'comment-text';
      case 'reaction': return 'heart';
      case 'message': return 'message-text';
      case 'message_reaction': return 'emoticon-excited';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accept':
        return '#1D9BF0';
      case 'comment':
        return '#00BA7C';
      case 'reaction':
        return '#F91880';
      case 'message':
      case 'message_reaction':
        return '#7856FF';
      default:
        return '#536471';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}p`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}g`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}ng`;
    return `${Math.floor(diffInSeconds / 604800)}t`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'mentions') return notification.type === 'comment';
    return false;
  });

  const NotificationItem = ({ item }) => {
    const [scaleAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
        onPress={() => handleMarkAsRead(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.notificationContent, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.avatarContainer}>
            <UserAvatar 
              user={{
                id: item.related_user_id,
                user_id: item.related_user_id,
                username: item.username,
                full_name: item.full_name,
                avatar_url: item.avatar_url
              }}
              size={48}
            />
            <View style={[styles.iconBadge, { backgroundColor: getNotificationColor(item.type) }]}>
              <IconButton
                icon={getNotificationIcon(item.type)}
                size={14}
                iconColor="#fff"
                style={styles.badgeIcon}
              />
            </View>
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.notificationText} numberOfLines={3}>
                <Text style={styles.username}>{item.full_name || item.username || 'Ai đó'}</Text>
                <Text style={styles.message}> {item.content}</Text>
              </Text>
              <View style={styles.metaContainer}>
                <Text style={styles.timeText}>{getTimeAgo(item.created_at)}</Text>
              </View>
            </View>
          </View>

          {!item.is_read && (
            <View style={styles.unreadIndicator}>
              <View style={styles.unreadDot} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderNotification = ({ item }) => <NotificationItem item={item} />;

  const TabButton = ({ title, value, count }) => (
    <TouchableOpacity 
      style={[styles.tab, selectedTab === value && styles.activeTab]}
      onPress={() => setSelectedTab(value)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, selectedTab === value && styles.activeTabText]}>
        {title}
      </Text>
      {selectedTab === value && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.settingsButton}>
            <IconButton
              icon="check-all"
              size={22}
              iconColor="#0F1419"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TabButton title="Tất cả" value="all" />
        <TabButton title="Được nhắc đến" value="mentions" />
      </View>
      
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1D9BF0']}
            tintColor="#1D9BF0"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <IconButton
                icon="bell-outline"
                size={80}
                iconColor="#CFD9DE"
              />
            </View>
            <Text style={styles.emptyTitle}>Không có thông báo mới</Text>
            <Text style={styles.emptySubtitle}>
              Khi bạn có thông báo mới, chúng sẽ xuất hiện ở đây
            </Text>
          </View>
        }
        contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyList : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFF3F4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1419',
    letterSpacing: 0.2,
  },
  settingsButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFF3F4',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#536471',
  },
  activeTabText: {
    color: '#0F1419',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: '100%',
    backgroundColor: '#1D9BF0',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFF3F4',
  },
  unreadItem: {
    backgroundColor: '#F7F9F9',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    margin: 0,
    padding: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#0F1419',
  },
  username: {
    fontWeight: '700',
    color: '#0F1419',
  },
  message: {
    color: '#0F1419',
    fontWeight: '400',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#536471',
    fontWeight: '400',
  },
  unreadIndicator: {
    justifyContent: 'flex-start',
    paddingTop: 4,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D9BF0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 31,
    fontWeight: '800',
    color: '#0F1419',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#536471',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default NotificationsScreen;
