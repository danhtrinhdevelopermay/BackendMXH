import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, Avatar, Button, Searchbar, Chip, Text, Divider } from 'react-native-paper';
import { friendshipAPI } from '../api/api';

const FriendsScreen = () => {
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
      Alert.alert('Error', 'Failed to fetch friends');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendshipAPI.getFriendRequests();
      setRequests(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch requests');
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
        Alert.alert('Error', 'Search failed');
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendshipAPI.sendFriendRequest({ addressee_id: userId });
      Alert.alert('Success', 'Friend request sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send request');
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await friendshipAPI.respondToFriendRequest(requestId, { status });
      Alert.alert('Success', `Request ${status}`);
      fetchRequests();
      fetchFriends();
    } catch (error) {
      Alert.alert('Error', 'Failed to respond');
    }
  };

  const renderFriend = ({ item }) => (
    <List.Item
      title={item.full_name || item.username}
      description={`@${item.username}`}
      left={(props) => <Avatar.Text {...props} label={item.username[0].toUpperCase()} />}
    />
  );

  const renderRequest = ({ item }) => (
    <List.Item
      title={item.full_name || item.username}
      description={`@${item.username}`}
      left={(props) => <Avatar.Text {...props} label={item.username[0].toUpperCase()} />}
      right={(props) => (
        <View style={styles.requestButtons}>
          <Button mode="contained" onPress={() => handleRespondRequest(item.request_id, 'accepted')}>
            Accept
          </Button>
          <Button mode="outlined" onPress={() => handleRespondRequest(item.request_id, 'rejected')}>
            Reject
          </Button>
        </View>
      )}
    />
  );

  const renderSearchResult = ({ item }) => (
    <List.Item
      title={item.full_name || item.username}
      description={`@${item.username}`}
      left={(props) => <Avatar.Text {...props} label={item.username[0].toUpperCase()} />}
      right={(props) => (
        <Button mode="outlined" onPress={() => handleSendRequest(item.id)}>
          Add Friend
        </Button>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Chip
          selected={activeTab === 'friends'}
          onPress={() => setActiveTab('friends')}
          style={styles.chip}
        >
          Friends ({friends.length})
        </Chip>
        <Chip
          selected={activeTab === 'requests'}
          onPress={() => setActiveTab('requests')}
          style={styles.chip}
        >
          Requests ({requests.length})
        </Chip>
        <Chip
          selected={activeTab === 'search'}
          onPress={() => setActiveTab('search')}
          style={styles.chip}
        >
          Search
        </Chip>
      </View>
      
      {activeTab === 'search' && (
        <Searchbar
          placeholder="Search users"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
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
          <Text style={styles.empty}>
            {activeTab === 'friends' ? 'No friends yet' :
             activeTab === 'requests' ? 'No pending requests' :
             searchQuery.length > 2 ? 'No users found' : 'Search for users to add as friends'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-around',
  },
  chip: {
    margin: 5,
  },
  searchbar: {
    margin: 10,
  },
  requestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default FriendsScreen;
