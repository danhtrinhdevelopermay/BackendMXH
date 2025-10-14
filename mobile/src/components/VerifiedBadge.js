import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const VerifiedBadge = ({ isVerified, size = 16, style }) => {
  const [showPopup, setShowPopup] = useState(false);

  if (!isVerified) return null;
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.container, style]}
        onPress={() => setShowPopup(true)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="check-decagram" 
          size={size} 
          color="#1da1f2" 
        />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showPopup}
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowPopup(false)}
        >
          <Pressable style={styles.popupContainer}>
            <View style={styles.popupHeader}>
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={24} 
                color="#1da1f2" 
              />
              <Text style={styles.popupTitle}>Tài khoản đã xác minh</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.popupText}>
              Tài khoản này là một người do chúng tôi xác minh là người nổi tiếng
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPopup(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e6eb',
    marginBottom: 16,
  },
  popupText: {
    fontSize: 15,
    color: '#65676b',
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#1877f2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VerifiedBadge;
