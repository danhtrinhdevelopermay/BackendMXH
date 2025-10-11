import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, Avatar, Badge, Text } from 'react-native-paper';
import { messageAPI } from '../api/api';

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderConversation = ({ item }) => (
    <List.Item
      title={item.full_name || item.username}
      description={item.last_message || 'No messages yet'}
      left={(props) => <Avatar.Text {...props} label={item.username?.[0]?.toUpperCase() || 'U'} />}
      right={(props) => (
        !item.is_read && item.sender_id !== item.other_user_id ? (
          <Badge style={styles.badge}>New</Badge>
        ) : null
      )}
      onPress={() => navigation.navigate('Chat', { 
        userId: item.other_user_id, 
        userName: item.full_name || item.username 
      })}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.other_user_id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  badge: {
    alignSelf: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
});

export default MessagesScreen;
