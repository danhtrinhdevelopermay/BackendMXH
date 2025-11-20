import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { thoughtAPI } from '../api/api';
import { useAlert } from '../context/AlertContext';

const EMOJI_OPTIONS = ['😊', '😂', '❤️', '🎉', '🔥', '👍', '🤔', '😎', '🌟', '💪'];

const CreateThoughtScreen = ({ navigation, route }) => {
  const { initialThought } = route.params || {};
  const { showAlert } = useAlert();
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialThought) {
      setContent(initialThought.content || '');
      setSelectedEmoji(initialThought.emoji || '');
    }
  }, [initialThought]);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      await thoughtAPI.createOrUpdateThought({ 
        content: content.trim(), 
        emoji: selectedEmoji 
      });
      showAlert('Thành công', 'Đã lưu suy nghĩ', 'success');
      navigation.goBack();
    } catch (error) {
      showAlert('Lỗi', 'Không thể lưu suy nghĩ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await thoughtAPI.deleteThought();
      showAlert('Thành công', 'Đã xóa suy nghĩ', 'success');
      navigation.goBack();
    } catch (error) {
      showAlert('Lỗi', 'Không thể xóa suy nghĩ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#050505" />
        </TouchableOpacity>
        <Text style={styles.title}>Chia sẻ suy nghĩ</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Chọn emoji</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.emojiScroll}
          contentContainerStyle={styles.emojiScrollContent}
        >
          {EMOJI_OPTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                selectedEmoji === emoji && styles.emojiButtonSelected,
              ]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Suy nghĩ của bạn</Text>
        <TextInput
          mode="outlined"
          value={content}
          onChangeText={setContent}
          placeholder="Bạn đang nghĩ gì?"
          maxLength={100}
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineColor="#e4e6eb"
          activeOutlineColor="#1877f2"
        />
        <Text style={styles.characterCount}>{content.length}/100</Text>

        <View style={styles.buttonContainer}>
          {initialThought && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={loading}
              style={styles.deleteButtonWrapper}
            >
              <View style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!content.trim() || loading}
            style={styles.saveButtonWrapper}
          >
            <LinearGradient
              colors={content.trim() ? ['#FF6B35', '#F7931E'] : ['#ccc', '#999']}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {initialThought ? 'Cập nhật' : 'Chia sẻ'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
    marginTop: 8,
    marginBottom: 12,
  },
  emojiScroll: {
    marginBottom: 20,
  },
  emojiScrollContent: {
    paddingRight: 16,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emojiButtonSelected: {
    backgroundColor: '#e7f3ff',
    borderWidth: 2,
    borderColor: '#1877f2',
  },
  emoji: {
    fontSize: 24,
  },
  input: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#65676b',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deleteButtonWrapper: {
    flex: 1,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e41e3f',
  },
  deleteButtonText: {
    color: '#e41e3f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateThoughtScreen;
