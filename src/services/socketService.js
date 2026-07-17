import { io } from 'socket.io-client';
import { API_URL } from '../config/api.config';
import { getToken } from '../utils/authStorage';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  async connect() {
    try {
      if (this.socket && this.connected) {
        console.log('Socket already connected');
        return;
      }

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = API_URL.replace('/api', '');

      this.socket = io(baseUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.setupDefaultListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log('Socket connected:', this.socket.id);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('Socket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    }
  }

  setupDefaultListeners() {
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log('Joined conversation:', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log('Left conversation:', conversationId);
    }
  }

  // Send a message
  sendMessage(data) {
    if (this.socket && this.connected) {
      this.socket.emit('send_message', data);
    } else {
      console.error('Socket not connected. Cannot send message.');
      throw new Error('Socket not connected');
    }
  }

  // Typing indicators
  startTyping(conversationId, receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_start', { conversationId, receiverId });
    }
  }

  stopTyping(conversationId, receiverId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_stop', { conversationId, receiverId });
    }
  }

  // Mark messages as read
  markAsRead(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('mark_as_read', { conversationId });
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    // Store the callback
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Add listener to socket
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) {
      return;
    }

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }

    // Remove from socket
    this.socket.off(event, callback);
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // Convenience methods for common events
  onNewMessage(callback) {
    this.on('new_message', callback);
  }

  onMessageSent(callback) {
    this.on('message_sent', callback);
  }

  onMessageError(callback) {
    this.on('message_error', callback);
  }

  onMessageNotification(callback) {
    this.on('message_notification', callback);
  }

  onUserTyping(callback) {
    this.on('user_typing', callback);
  }

  onUserStopTyping(callback) {
    this.on('user_stop_typing', callback);
  }

  onMessagesRead(callback) {
    this.on('messages_read', callback);
  }

  onUserOnline(callback) {
    this.on('user_online', callback);
  }

  onUserOffline(callback) {
    this.on('user_offline', callback);
  }

  onOnlineUsers(callback) {
    this.on('online_users', callback);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

