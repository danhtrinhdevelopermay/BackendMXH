import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGE_STORAGE_KEY = 'USER_MESSAGES';
const BACKUP_METADATA_KEY = 'BACKUP_METADATA';

class MessageStorageService {
  async saveMessage(message, userId) {
    try {
      const storageKey = `${MESSAGE_STORAGE_KEY}_${userId}`;
      const existingMessages = await this.getMessages(userId);
      const updatedMessages = [...existingMessages, message];
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      return true;
    } catch (error) {
      console.error('Error saving message to local storage:', error);
      return false;
    }
  }

  async saveMessages(messages, userId) {
    try {
      const storageKey = `${MESSAGE_STORAGE_KEY}_${userId}`;
      const existingMessages = await this.getMessages(userId);
      
      const messageMap = new Map();
      [...existingMessages, ...messages].forEach(msg => {
        messageMap.set(msg.id, msg);
      });
      
      const updatedMessages = Array.from(messageMap.values());
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      return true;
    } catch (error) {
      console.error('Error saving messages to local storage:', error);
      return false;
    }
  }

  async getMessages(userId) {
    try {
      const storageKey = `${MESSAGE_STORAGE_KEY}_${userId}`;
      const messagesStr = await AsyncStorage.getItem(storageKey);
      return messagesStr ? JSON.parse(messagesStr) : [];
    } catch (error) {
      console.error('Error getting messages from local storage:', error);
      return [];
    }
  }

  async getAllConversations() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(key => key.startsWith(MESSAGE_STORAGE_KEY));
      
      const conversations = [];
      for (const key of messageKeys) {
        const userId = key.replace(`${MESSAGE_STORAGE_KEY}_`, '');
        const messages = await this.getMessages(userId);
        if (messages.length > 0) {
          conversations.push({
            userId,
            messages,
            lastMessage: messages[messages.length - 1]
          });
        }
      }
      
      return conversations;
    } catch (error) {
      console.error('Error getting all conversations from local storage:', error);
      return [];
    }
  }

  async clearMessages(userId) {
    try {
      const storageKey = `${MESSAGE_STORAGE_KEY}_${userId}`;
      await AsyncStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing messages from local storage:', error);
      return false;
    }
  }

  async clearAllMessages() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(key => key.startsWith(MESSAGE_STORAGE_KEY));
      await AsyncStorage.multiRemove(messageKeys);
      return true;
    } catch (error) {
      console.error('Error clearing all messages from local storage:', error);
      return false;
    }
  }

  async exportAllMessages() {
    try {
      const conversations = await this.getAllConversations();
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        conversations
      };
      return JSON.stringify(backup);
    } catch (error) {
      console.error('Error exporting messages:', error);
      return null;
    }
  }

  async importMessages(backupData) {
    try {
      const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
      
      if (!backup.conversations || !Array.isArray(backup.conversations)) {
        throw new Error('Invalid backup format');
      }

      await this.clearAllMessages();

      for (const conversation of backup.conversations) {
        await this.saveMessages(conversation.messages, conversation.userId);
      }

      await this.saveBackupMetadata({
        lastRestore: new Date().toISOString(),
        backupVersion: backup.version,
        backupTimestamp: backup.timestamp
      });

      return {
        success: true,
        conversationsRestored: backup.conversations.length
      };
    } catch (error) {
      console.error('Error importing messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveBackupMetadata(metadata) {
    try {
      await AsyncStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(metadata));
      return true;
    } catch (error) {
      console.error('Error saving backup metadata:', error);
      return false;
    }
  }

  async getBackupMetadata() {
    try {
      const metadataStr = await AsyncStorage.getItem(BACKUP_METADATA_KEY);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error('Error getting backup metadata:', error);
      return null;
    }
  }

  async getStorageStats() {
    try {
      const conversations = await this.getAllConversations();
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      
      return {
        totalConversations: conversations.length,
        totalMessages,
        conversations: conversations.map(conv => ({
          userId: conv.userId,
          messageCount: conv.messages.length,
          lastMessageTime: conv.lastMessage?.created_at
        }))
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

export default new MessageStorageService();
