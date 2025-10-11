import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Avatar, Button, Searchbar, Text, Divider, Card } from 'react-native-paper';
import { friendshipAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';

const FriendsScreen = () => {
  const { showAlert } = useAlert();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const response = await friendshipAPI.searchUsers(query);
        setSearchResults(response.data);
      } catch (error) {
        showAlert('Error', 'Search failed', 'error');
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendshipAPI.sendFriendRequest({ addressee_id: userId });
      showAlert('Success', 'Friend request sent', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to send request', 'error');
    }
  };

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
            <Text style={styles.friendName}>{item.full_name || item.username}</Text>
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
            <Text style={styles.requestName}>{item.full_name || item.username}</Text>
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

  const renderSearchResult = ({ item }) => (
    <Card style={styles.searchCard} elevation={0}>
      <View style={styles.searchContainer}>
        <View style={styles.searchLeft}>
          <Avatar.Text 
            size={60} 
            label={item.username[0].toUpperCase()}
            style={styles.searchAvatar}
          />
          <View style={styles.searchInfo}>
            <Text style={styles.searchName}>{item.full_name || item.username}</Text>
            <Text style={styles.searchUsername}>@{item.username}</Text>
          </View>
        </View>
        <Button 
          mode="contained" 
          onPress={() => handleSendRequest(item.id)}
          style={styles.addButton}
          buttonColor="#1877f2"
          compact
        >
          Add Friend
        </Button>
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
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Tìm kiếm
          </Text>
        </TouchableOpacity>
      </View>
      
      <Divider style={styles.headerDivider} />
      
      {activeTab === 'search' && (
        <Searchbar
          placeholder="Search users"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          elevation={0}
        />
      )}

      <FlatList
        data={
          activeTab === 'friends' ? friends :
          activeTab === 'requests' ? requests :
          searchResults
        }
        renderItem={
          activeTab === 'friends' ? renderFriend :
          activeTab === 'requests' ? renderRequest :
          renderSearchResult
        }
        keyExtractor={(item) => item.id?.toString() || item.user_id?.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'friends' ? 'No friends yet' :
               activeTab === 'requests' ? 'Không có yêu cầu nào' :
               searchQuery.length > 2 ? 'No users found' : 'Search for users to add as friends'}
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
  searchbar: {
    margin: 12,
    backgroundColor: '#f0f2f5',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  friendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 6,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 6,
    borderColor: '#ccd0d5',
  },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchAvatar: {
    backgroundColor: '#1877f2',
  },
  searchInfo: {
    marginLeft: 12,
    flex: 1,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
  },
  searchUsername: {
    fontSize: 14,
    color: '#65676b',
    marginTop: 2,
  },
  addButton: {
    borderRadius: 6,
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
