import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, Avatar, Button, Text } from 'react-native-paper';
import { notificationAPI } from '../api/api';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch notifications');
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
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
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

  const renderNotification = ({ item }) => (
    <List.Item
      title={item.username || 'Someone'}
      description={item.content}
      left={(props) => (
        <Avatar.Icon {...props} icon={getNotificationIcon(item.type)} />
      )}
      right={(props) => (
        !item.is_read ? (
          <Button mode="text" onPress={() => handleMarkAsRead(item.id)}>
            Mark Read
          </Button>
        ) : null
      )}
      style={!item.is_read ? styles.unread : styles.read}
    />
  );

  return (
    <View style={styles.container}>
      {notifications.some(n => !n.is_read) && (
        <Button mode="text" onPress={handleMarkAllAsRead} style={styles.markAllButton}>
          Mark All as Read
        </Button>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  markAllButton: {
    alignSelf: 'flex-end',
    margin: 10,
  },
  unread: {
    backgroundColor: '#e3f2fd',
  },
  read: {
    backgroundColor: '#fff',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default NotificationsScreen;
