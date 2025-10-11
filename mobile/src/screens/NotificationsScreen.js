import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Button, Text, Card, IconButton } from 'react-native-paper';
import { notificationAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';

const NotificationsScreen = () => {
  const { showAlert } = useAlert();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      showAlert('Error', 'Failed to mark as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      showAlert('Error', 'Failed to mark all as read', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request': return 'account-plus';
      case 'friend_accept': return 'account-check';
      case 'comment': return 'comment';
      case 'reaction': return 'thumb-up';
      case 'message': return 'message';
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
        return '#9b59b6';
      default:
        return '#65676b';
    }
  };

  const renderNotification = ({ item }) => (
    <Card 
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]} 
      elevation={0}
    >
      <View style={styles.notificationContainer}>
        <Avatar.Icon 
          size={56} 
          icon={getNotificationIcon(item.type)}
          style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            <Text style={styles.username}>{item.username || 'Someone'}</Text>{' '}
            <Text style={styles.notificationText}>{item.content}</Text>
          </Text>
        </View>
        {!item.is_read && (
          <IconButton
            icon="check"
            size={20}
            onPress={() => handleMarkAsRead(item.id)}
            iconColor="#1877f2"
          />
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {notifications.some(n => !n.is_read) && (
        <View style={styles.headerContainer}>
          <Button 
            mode="text" 
            onPress={handleMarkAllAsRead} 
            textColor="#1877f2"
          >
            Xóa Tất Cả
          </Button>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginBottom: 1,
    borderRadius: 0,
  },
  unreadCard: {
    backgroundColor: '#f0f8ff',
  },
  notificationContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  notificationIcon: {
    backgroundColor: '#1877f2',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  username: {
    fontWeight: '600',
    color: '#050505',
  },
  notificationText: {
    color: '#050505',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
