import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Button, Text, IconButton, Searchbar } from 'react-native-paper';
import { friendshipAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';
import UserAvatar from '../components/UserAvatar';
import VerifiedBadge from '../components/VerifiedBadge';

const FriendsScreen = () => {
  const { showAlert } = useAlert();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState(new Set());

  const fetchFriends = async () => {
    try {
      const response = await friendshipAPI.getFriends();
      setFriends(response.data);
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải danh sách bạn bè', 'error');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendshipAPI.getFriendRequests();
      setRequests(response.data);
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải yêu cầu kết bạn', 'error');
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await friendshipAPI.getSuggestedFriends();
      setSuggestions(response.data);
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải gợi ý kết bạn', 'error');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchSuggestions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchRequests(), fetchSuggestions()]);
    setRefreshing(false);
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await friendshipAPI.respondToFriendRequest(requestId, { status });
      showAlert('Thành công', status === 'accepted' ? 'Đã chấp nhận lời mời kết bạn' : 'Đã xóa lời mời', 'success');
      fetchRequests();
      fetchFriends();
    } catch (error) {
      showAlert('Lỗi', 'Không thể phản hồi yêu cầu', 'error');
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendshipAPI.sendFriendRequest({ addressee_id: userId });
      setSentRequests(prev => new Set([...prev, userId]));
      showAlert('Thành công', 'Đã gửi lời mời kết bạn', 'success');
      fetchSuggestions();
    } catch (error) {
      showAlert('Lỗi', 'Không thể gửi lời mời kết bạn', 'error');
    }
  };

  const handleRemoveSuggestion = (userId) => {
    setSuggestions(prev => prev.filter(item => item.id !== userId));
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity style={styles.friendCard} activeOpacity={0.7}>
      <View style={styles.friendContainer}>
        <UserAvatar 
          user={item}
          size={80}
        />
        <View style={styles.friendInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.friendName} numberOfLines={1}>
              {item.full_name || item.username}
            </Text>
            <VerifiedBadge isVerified={item.is_verified} size={16} />
          </View>
          <Text style={styles.friendMutual} numberOfLines={1}>
            @{item.username}
          </Text>
        </View>
        <IconButton
          icon="dots-horizontal"
          size={24}
          iconColor="#65676b"
          onPress={() => {}}
          style={styles.moreButton}
        />
      </View>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        <UserAvatar 
          user={item}
          size={80}
        />
        <IconButton
          icon="close"
          size={20}
          iconColor="#65676b"
          onPress={() => handleRespondRequest(item.request_id, 'rejected')}
          style={styles.closeButton}
        />
      </View>
      <View style={styles.requestInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.requestName} numberOfLines={1}>
            {item.full_name || item.username}
          </Text>
          <VerifiedBadge isVerified={item.is_verified} size={16} />
        </View>
        <Text style={styles.mutualFriends} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
      <View style={styles.requestButtons}>
        <Button 
          mode="contained" 
          onPress={() => handleRespondRequest(item.request_id, 'accepted')}
          style={styles.acceptButton}
          buttonColor="#1877f2"
          labelStyle={styles.buttonLabel}
        >
          Xác nhận
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => handleRespondRequest(item.request_id, 'rejected')}
          style={styles.deleteButton}
          textColor="#050505"
          labelStyle={styles.buttonLabel}
        >
          Xóa
        </Button>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionTop}>
        <UserAvatar 
          user={item}
          size={80}
        />
        <IconButton
          icon="close"
          size={20}
          iconColor="#65676b"
          onPress={() => handleRemoveSuggestion(item.id)}
          style={styles.closeButton}
        />
      </View>
      <View style={styles.suggestionInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.suggestionName} numberOfLines={1}>
            {item.full_name || item.username}
          </Text>
          <VerifiedBadge isVerified={item.is_verified} size={16} />
        </View>
        {item.mutual_friends_count > 0 && (
          <Text style={styles.mutualText} numberOfLines={1}>
            {item.mutual_friends_count} bạn chung
          </Text>
        )}
      </View>
      <View style={styles.suggestionButtons}>
        <Button 
          mode="contained" 
          onPress={() => handleSendFriendRequest(item.id)}
          style={styles.addFriendButton}
          buttonColor="#1877f2"
          labelStyle={styles.buttonLabel}
          disabled={sentRequests.has(item.id)}
        >
          {sentRequests.has(item.id) ? 'Đã gửi' : 'Thêm bạn bè'}
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => handleRemoveSuggestion(item.id)}
          style={styles.removeButton}
          textColor="#050505"
          labelStyle={styles.buttonLabel}
        >
          Gỡ
        </Button>
      </View>
    </View>
  );

  const renderSuggestions = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1877f2']}
          tintColor="#1877f2"
        />
      }
      contentContainerStyle={suggestions.length === 0 ? styles.emptyList : styles.suggestionsContent}
    >
      {suggestions.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Những người bạn có thể biết</Text>
          </View>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((item) => (
              <View key={item.id?.toString()}>
                {renderSuggestion({ item })}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="account-multiple-outline"
            size={64}
            iconColor="#bcc0c4"
          />
          <Text style={styles.emptyText}>Không có gợi ý kết bạn</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderAllFriends = () => (
    <FlatList
      data={friends}
      renderItem={renderFriend}
      keyExtractor={(item) => item.id?.toString() || item.user_id?.toString()}
      numColumns={2}
      columnWrapperStyle={styles.friendsRow}
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
            icon="account-multiple-outline"
            size={64}
            iconColor="#bcc0c4"
          />
          <Text style={styles.emptyText}>Chưa có bạn bè</Text>
        </View>
      }
      contentContainerStyle={friends.length === 0 ? styles.emptyList : styles.listContent}
    />
  );

  const renderRequests = () => (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1877f2']}
          tintColor="#1877f2"
        />
      }
      contentContainerStyle={requests.length === 0 ? styles.emptyList : styles.requestsContent}
    >
      {requests.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
            <Text style={styles.sectionCount}>{requests.length}</Text>
          </View>
          <View style={styles.requestsGrid}>
            {requests.map((item) => (
              <View key={item.user_id?.toString() || item.id?.toString()}>
                {renderRequest({ item })}
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="account-alert-outline"
            size={64}
            iconColor="#bcc0c4"
          />
          <Text style={styles.emptyText}>Không có lời mời kết bạn</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <View style={styles.headerIcons}>
          <IconButton
            icon="magnify"
            size={24}
            iconColor="#050505"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suggestions' && styles.activeTab]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text style={[styles.tabText, activeTab === 'suggestions' && styles.activeTabText]}>
            Gợi ý
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Tất cả bạn bè
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Lời mời
          </Text>
          {requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'suggestions' && renderSuggestions()}
      {activeTab === 'friends' && renderAllFriends()}
      {activeTab === 'requests' && renderRequests()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#050505',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
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
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 8,
    paddingBottom: 16,
  },
  friendsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  friendCard: {
    backgroundColor: '#fff',
    margin: 4,
    borderRadius: 8,
    flex: 1,
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: '#e4e6eb',
  },
  friendContainer: {
    padding: 12,
    alignItems: 'center',
  },
  friendInfo: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    textAlign: 'center',
  },
  friendMutual: {
    fontSize: 13,
    color: '#65676b',
    textAlign: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050505',
  },
  sectionCount: {
    fontSize: 15,
    color: '#65676b',
  },
  requestsContent: {
    paddingBottom: 16,
  },
  requestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  requestCard: {
    backgroundColor: '#fff',
    margin: 4,
    borderRadius: 8,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e4e6eb',
    padding: 12,
  },
  requestTop: {
    position: 'relative',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  requestInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    textAlign: 'center',
  },
  mutualFriends: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
    textAlign: 'center',
  },
  requestButtons: {
    marginTop: 12,
    gap: 8,
  },
  acceptButton: {
    borderRadius: 6,
  },
  deleteButton: {
    borderRadius: 6,
    borderColor: '#ccd0d5',
    backgroundColor: '#e4e6eb',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 15,
    color: '#8a8d91',
    marginTop: 4,
  },
  suggestionsContent: {
    paddingBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    margin: 4,
    borderRadius: 8,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e4e6eb',
    padding: 12,
  },
  suggestionTop: {
    position: 'relative',
    alignItems: 'center',
  },
  suggestionInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    textAlign: 'center',
  },
  mutualText: {
    fontSize: 13,
    color: '#65676b',
    marginTop: 2,
    textAlign: 'center',
  },
  suggestionButtons: {
    marginTop: 12,
    gap: 8,
  },
  addFriendButton: {
    borderRadius: 6,
  },
  removeButton: {
    borderRadius: 6,
    borderColor: '#ccd0d5',
    backgroundColor: '#e4e6eb',
  },
});

export default FriendsScreen;
