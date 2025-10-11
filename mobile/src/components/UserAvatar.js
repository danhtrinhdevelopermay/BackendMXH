import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import Constants from 'expo-constants';

const UserAvatar = ({ user, size = 40, style }) => {
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
  
  const avatarUrl = user?.avatar_url 
    ? `${API_URL}/api/avatar/${user.user_id || user.id}`
    : null;

  const initials = (user?.full_name || user?.username || 'U')[0].toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatarImage,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      />
    );
  }

  return (
    <Avatar.Text
      size={size}
      label={initials}
      style={[styles.avatarText, style]}
    />
  );
};

const styles = StyleSheet.create({
  avatarImage: {
    backgroundColor: '#e4e6eb',
  },
  avatarText: {
    backgroundColor: '#1877f2',
  },
});

export default UserAvatar;
