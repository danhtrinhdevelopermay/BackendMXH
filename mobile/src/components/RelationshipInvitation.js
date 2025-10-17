import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { relationshipAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';

const RelationshipInvitation = ({ senderId, onResponse }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await relationshipAPI.acceptRelationship({ sender_id: senderId });
      showAlert('Thành công', 'Bạn đã chấp nhận hẹn hò', 'success');
      setResponded(true);
      if (onResponse) onResponse('accepted');
    } catch (error) {
      showAlert('Lỗi', 'Không thể chấp nhận lời mời', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await relationshipAPI.rejectRelationship({ sender_id: senderId });
      showAlert('Đã từ chối', 'Bạn đã từ chối lời mời hẹn hò', 'info');
      setResponded(true);
      if (onResponse) onResponse('rejected');
    } catch (error) {
      showAlert('Lỗi', 'Không thể từ chối lời mời', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (responded) {
    return (
      <View style={styles.invitationCard}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="heart-multiple" size={40} color="#FF6B9D" />
        </View>
        <Text style={styles.title}>💕 Lời mời hẹn hò</Text>
        <Text style={styles.respondedText}>Đã phản hồi</Text>
      </View>
    );
  }

  return (
    <View style={styles.invitationCard}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="heart-multiple" size={40} color="#FF6B9D" />
      </View>
      <Text style={styles.title}>💕 Lời mời hẹn hò</Text>
      <Text style={styles.message}>Bạn có muốn hẹn hò không?</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
          disabled={loading}
        >
          <MaterialCommunityIcons name="close" size={20} color="#65676B" />
          <Text style={styles.rejectText}>Từ chối</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={loading}
        >
          <MaterialCommunityIcons name="heart" size={20} color="#FFF" />
          <Text style={styles.acceptText}>Chấp nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFE5EE',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF6B9D',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#65676B',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#FF6B9D',
  },
  rejectButton: {
    backgroundColor: '#F0F2F5',
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectText: {
    color: '#65676B',
    fontSize: 15,
    fontWeight: '600',
  },
  respondedText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#65676B',
    fontStyle: 'italic',
  },
});

export default RelationshipInvitation;
