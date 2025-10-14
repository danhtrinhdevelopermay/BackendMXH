import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Avatar, Button, Text, Divider, Card } from 'react-native-paper';
import { friendshipAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';

const FriendsScreen = () => {
  const { showAlert } = useAlert();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');

  const fetchFriends = async () => {
    try {
      const response = await friendshipAPI.getFriends();
      setFriends(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to fetch friends', 'error');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendshipAPI.getFriendRequests();
      setRequests(response.data);
    } catch (error) {
      showAlert('Error', 'Failed to fetch requests', 'error');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const handleRespondRequest = async (requestId, status) => {
    try {
      await friendshipAPI.respondToFriendRequest(requestId, { status });
      showAlert('Success', `Request ${status}`, 'success');
      fetchRequests();
      fetchFriends();
    } catch (error) {
      showAlert('Error', 'Failed to respond', 'error');
    }
  };

  const renderFriend = ({ item }) => (
    <Card style={styles.friendCard} elevation={0}>
      <View style={styles.friendContainer}>
        <View style={styles.friendLeft}>
          <UserAvatar 
            user={item}
            size={60}
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.friendName}>{item.full_name || item.username}</Text>
              <VerifiedBadge isVerified={item.is_verified} size={16} />
            </View>
            <Text style={styles.friendUsername}>@{item.username}</Text>
          </View>
        </View>
        <Button 
          mode="outlined" 
          style={styles.friendButton}
          textColor="#65676b"
        >
          Bạn bè
        </Button>
      </View>
    </Card>
  );

  const renderRequest = ({ item }) => (
    <Card style={styles.requestCard} elevation={0}>
      <View style={styles.requestContainer}>
        <View style={styles.requestLeft}>
          <UserAvatar 
            user={item}
            size={60}
            style={styles.requestAvatar}
          />
          <View style={styles.requestInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.requestName}>{item.full_name || item.username}</Text>
              <VerifiedBadge isVerified={item.is_verified} size={16} />
            </View>
            <Text style={styles.requestUsername}>@{item.username}</Text>
          </View>
        </View>
        <View style={styles.requestButtons}>
          <Button 
            mode="contained" 
            onPress={() => handleRespondRequest(item.request_id, 'accepted')}
            style={styles.acceptButton}
            buttonColor="#1877f2"
            compact
          >
            Confirm
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => handleRespondRequest(item.request_id, 'rejected')}
            style={styles.rejectButton}
            textColor="#65676b"
            compact
          >
            Delete
          </Button>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Bạn bè
          </Text>
          {friends.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friends.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Yêu cầu
          </Text>
          {requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <Divider style={styles.headerDivider} />

      <FlatList
        data={activeTab === 'friends' ? friends : requests}
        renderItem={activeTab === 'friends' ? renderFriend : renderRequest}
        keyExtractor={(item) => item.id?.toString() || item.user_id?.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'friends' ? 'No friends yet' : 'Không có yêu cầu nào'}
            </Text>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1877f2',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#65676b',
  },
  activeTabText: {
    color: '#1877f2',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#e7f3ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: '#1877f2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e4e6eb',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  friendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  friendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    backgroundColor: '#1877f2',
  },
  friendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  friendUsername: {
    fontSize: 14,
    color: '#65676b',
    marginTop: 2,
  },
  friendButton: {
    borderColor: '#ccd0d5',
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  requestContainer: {
    padding: 12,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatar: {
    backgroundColor: '#1877f2',
  },
  requestInfo: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  requestUsername: {
    fontSize: 14,
    color: '#65676b',
    marginTop: 2,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 10,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 6,
    borderColor: '#ccd0d5',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
  },
});

export default FriendsScreen;
