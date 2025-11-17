import { io } from 'socket.io-client';
import Constants from 'expo-constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
  }

  connect(userId) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!this.socket) {
      this.socket = io(this.API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        if (userId) {
          this.socket.emit('user_online', userId);
        }
      });

      this.socket.on('connect_error', (error) => {
        if (error.message !== 'websocket error') {
          console.log('⚠️ Socket connection issue:', error.message || 'Unknown error');
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
