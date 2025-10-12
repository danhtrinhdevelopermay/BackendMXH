import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from './UserAvatar';

const ThoughtsBar = ({ thoughts, currentUserId, onCreateThought }) => {
  const currentUserThought = thoughts.find(t => t.user_id === currentUserId);
  const otherThoughts = thoughts.filter(t => t.user_id !== currentUserId);

  const renderThoughtItem = (thought, isCurrentUser = false) => (
    <TouchableOpacity
      key={thought.user_id}
      style={styles.thoughtItem}
      onPress={isCurrentUser ? onCreateThought : null}
    >
      <View style={styles.thoughtContainer}>
        {isCurrentUser && !currentUserThought ? (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.addThoughtGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        ) : (
          <UserAvatar 
            user={thought}
            userId={thought.user_id}
            size={60}
            style={styles.avatar}
          />
        )}
        {thought.content && (
          <View style={styles.thoughtBubble}>
            <Text style={styles.thoughtText} numberOfLines={2}>
              {thought.emoji || ''} {thought.content}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {isCurrentUser ? 'Tạo tin' : (thought.full_name || thought.username)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderThoughtItem(
          currentUserThought || { user_id: currentUserId },
          true
        )}
        {otherThoughts.map(thought => renderThoughtItem(thought))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  thoughtItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 72,
  },
  thoughtContainer: {
    position: 'relative',
    marginBottom: 12,
    minHeight: 60,
    paddingTop: 28,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#1877f2',
  },
  addThoughtGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thoughtBubble: {
    position: 'absolute',
    top: -20,
    left: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#1877f2',
    maxWidth: 100,
    zIndex: 1,
  },
  thoughtText: {
    fontSize: 10,
    color: '#050505',
    textAlign: 'center',
    fontWeight: '500',
  },
  userName: {
    fontSize: 12,
    color: '#050505',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ThoughtsBar;
