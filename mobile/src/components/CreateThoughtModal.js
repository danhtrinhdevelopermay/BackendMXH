import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Portal, Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const EMOJI_OPTIONS = ['😊', '😂', '❤️', '🎉', '🔥', '👍', '🤔', '😎', '🌟', '💪'];

const CreateThoughtModal = ({ visible, onDismiss, onSave, initialThought }) => {
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');

  useEffect(() => {
    if (initialThought) {
      setContent(initialThought.content || '');
      setSelectedEmoji(initialThought.emoji || '');
    } else {
      setContent('');
      setSelectedEmoji('');
    }
  }, [initialThought, visible]);

  const handleSave = () => {
    if (content.trim()) {
      onSave({ content: content.trim(), emoji: selectedEmoji });
      setContent('');
      setSelectedEmoji('');
    }
  };

  const handleDelete = () => {
    onSave(null);
    setContent('');
    setSelectedEmoji('');
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={styles.modalWrapper}
      >
        <BlurView intensity={80} tint="dark" experimentalBlurMethod="dimezisBlurView" style={styles.blurContainer}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Chia sẻ suy nghĩ</Text>
              <TouchableOpacity onPress={onDismiss}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.label}>Chọn emoji</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiScroll}
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
                  <Button
                    mode="outlined"
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    textColor="#e41e3f"
                  >
                    Xóa
                  </Button>
                )}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!content.trim()}
                  style={styles.saveButtonWrapper}
                >
                  <LinearGradient
                    colors={content.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#999']}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>
                      {initialThought ? 'Cập nhật' : 'Chia sẻ'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
  },
  closeButton: {
    fontSize: 24,
    color: '#65676b',
  },
  content: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
    marginTop: 8,
  },
  emojiScroll: {
    marginVertical: 8,
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
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#e41e3f',
  },
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 12,
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

export default CreateThoughtModal;
