import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import Constants from 'expo-constants';

const UserAvatar = React.memo(({ user, userId: userIdProp, size = 40, style }) => {
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
  const [imageError, setImageError] = useState(false);
  
  const userId = userIdProp || user?.user_id || user?.id;
  const hasAvatar = user?.avatar_url && user.avatar_url.trim() !== '';
  const avatarUrl = hasAvatar && userId ? `${API_URL}/api/avatar/${userId}` : null;

  const initials = (user?.full_name || user?.username || 'U')[0].toUpperCase();

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  if (avatarUrl && !imageError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          styles.avatarImage,
          { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
        onError={(e) => {
          setImageError(true);
        }}
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
}, (prevProps, nextProps) => {
  const prevUserId = prevProps.userId || prevProps.user?.user_id || prevProps.user?.id;
  const nextUserId = nextProps.userId || nextProps.user?.user_id || nextProps.user?.id;
  
  return prevUserId === nextUserId &&
         prevProps.user?.avatar_url === nextProps.user?.avatar_url &&
         prevProps.size === nextProps.size;
});

const styles = StyleSheet.create({
  avatarImage: {
    backgroundColor: '#e4e6eb',
  },
  avatarText: {
    backgroundColor: '#1877f2',
  },
});

export default UserAvatar;
