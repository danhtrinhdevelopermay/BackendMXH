import React, { useState, useEffect } from 'react';
import { View, Modal, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { reactionAPI } from '../api/api';
import Constants from 'expo-constants';
import UserAvatar from './UserAvatar';
import VerifiedBadge from './VerifiedBadge';

const ReactionsModal = ({ visible, onClose, postId }) => {
  const [reactions, setReactions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

  useEffect(() => {
    if (visible && postId) {
      fetchReactions();
    }
  }, [visible, postId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      const response = await reactionAPI.getReactions(postId);
      setReactions(response.data.reactions || []);
      setSummary(response.data.summary || []);
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReactionIcon = (reactionType) => {
    const icons = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😡'
    };
    return icons[reactionType] || '👍';
  };

  const getReactionLabel = (reactionType) => {
    const labels = {
      like: 'Thích',
      love: 'Yêu thích',
      haha: 'Haha',
      wow: 'Wow',
      sad: 'Buồn',
      angry: 'Phẫn nộ'
    };
    return labels[reactionType] || reactionType;
  };

  const filteredReactions = selectedType === 'all' 
    ? reactions 
    : reactions.filter(r => r.reaction_type === selectedType);

  const totalCount = reactions.length;

  const renderReactionTab = ({ item }) => {
    const isSelected = selectedType === item.reaction_type;
    return (
      <TouchableOpacity
        style={[styles.reactionTab, isSelected && styles.reactionTabActive]}
        onPress={() => setSelectedType(item.reaction_type)}
      >
        <Text style={styles.reactionTabIcon}>{getReactionIcon(item.reaction_type)}</Text>
        <Text style={[styles.reactionTabCount, isSelected && styles.reactionTabCountActive]}>
          {item.count}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReaction = ({ item }) => (
    <View style={styles.reactionItem}>
      <UserAvatar 
        user={item}
        size={44}
        style={styles.userAvatar}
      />
      <View style={styles.reactionInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.userName}>{item.full_name || item.username}</Text>
          <VerifiedBadge isVerified={item.is_verified} size={14} />
        </View>
      </View>
      <View style={styles.reactionIconContainer}>
        <Text style={styles.reactionIconLarge}>{getReactionIcon(item.reaction_type)}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" experimentalBlurMethod="dimezisBlurView" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reactions ({totalCount})</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#65676b" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.reactionTab, selectedType === 'all' && styles.reactionTabActive]}
              onPress={() => setSelectedType('all')}
            >
              <Text style={styles.reactionTabText}>Tất cả</Text>
              <Text style={[styles.reactionTabCount, selectedType === 'all' && styles.reactionTabCountActive]}>
                {totalCount}
              </Text>
            </TouchableOpacity>
            <FlatList
              horizontal
              data={summary}
              renderItem={renderReactionTab}
              keyExtractor={(item) => item.reaction_type}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          ) : (
            <FlatList
              data={filteredReactions}
              renderItem={renderReaction}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.reactionsList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có reactions</Text>
              }
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1e21',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    paddingHorizontal: 16,
  },
  tabsList: {
    paddingVertical: 8,
  },
  reactionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
  },
  reactionTabActive: {
    backgroundColor: '#e7f3ff',
  },
  reactionTabIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  reactionTabText: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
    marginRight: 4,
  },
  reactionTabCount: {
    fontSize: 14,
    color: '#65676b',
    fontWeight: '600',
  },
  reactionTabCountActive: {
    color: '#1877f2',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  reactionsList: {
    padding: 16,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userAvatar: {
    marginRight: 12,
  },
  reactionInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1e21',
  },
  reactionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionIconLarge: {
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#65676b',
    fontSize: 15,
    marginTop: 20,
  },
});

export default ReactionsModal;
