import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const VerifiedBadge = ({ isVerified, size = 16, style }) => {
  if (!isVerified) return null;
  
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons 
        name="check-decagram" 
        size={size} 
        color="#1da1f2" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
});

export default VerifiedBadge;
