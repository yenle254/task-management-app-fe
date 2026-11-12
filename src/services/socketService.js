import { io } from 'socket.io-client';
import { API_URL } from '../config/api.config';
import { getValidAccessToken, refreshAccessToken, expireSession, subscribeTokenChanged, isPasswordChanging, waitForPasswordChange, getAuthGeneration } from './tokenManager';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.rooms = new Set();
  }

  connect() {
    if (this.connected) return Promise.resolve();
    if (this.connecting) return this.connecting;
    this.connecting = this.openConnection().finally(() => { this.connecting = null; });
    return this.connecting;
  }

  async openConnection() {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');
    this.socket?.disconnect();
    this.unsubscribeToken?.();
    let authFailure = false;
    const connectedSocket = io(API_URL.replace('/api', ''), {
      autoConnect: false,
      auth: callback => {
        getValidAccessToken().then(value => { authFailure = false; connectedSocket.accessToken = value; callback({ token: value }); })
          .catch(() => { authFailure = true; callback({ token: null }); });
      },
      transports: ['websocket', 'polling'], reconnection: true,
      reconnectionDelay: 1000, reconnectionDelayMax: 5000, reconnectionAttempts: 5,
    });
    connectedSocket.accessToken = token;
    this.socket = connectedSocket;
    let refreshAttempts = 0;
    const recover = async () => {
      if (refreshAttempts++ >= 1 || this.socket !== connectedSocket) return false;
      const generation = getAuthGeneration();
      try {
        await refreshAccessToken(connectedSocket.accessToken);
        if (this.socket !== connectedSocket || generation !== getAuthGeneration()) return false;
        connectedSocket.connect();
        return true;
      } catch { return false; }
    };
    this.unsubscribeToken = subscribeTokenChanged(() => {
      if (this.socket === connectedSocket && this.connected) {
        connectedSocket.disconnect();
        connectedSocket.connect();
      }
    });
    connectedSocket.on('session_revoked', async event => {
      if (this.socket !== connectedSocket) return;
      connectedSocket.disconnect(); this.connected = false;
      if (event?.code === 'token_expired') { await recover(); return; }
      if (event?.reason === 'password_changed' && isPasswordChanging()) {
        try { await waitForPasswordChange(); if (this.socket === connectedSocket) connectedSocket.connect(); }
        catch { await expireSession(connectedSocket.accessToken); }
        return;
      }
      await expireSession(connectedSocket.accessToken);
    });
    this.setupDefaultListeners();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
      connectedSocket.on('connect', () => {
        clearTimeout(timeout); refreshAttempts = 0; this.connected = true;
        this.rooms?.forEach(id => connectedSocket.emit('join_conversation', id));
        resolve();
      });
      connectedSocket.on('connect_error', async error => {
        if (authFailure) { clearTimeout(timeout); connectedSocket.disconnect(); reject(new Error('Unable to refresh socket credentials')); return; }
        if (error.data?.code === 'token_expired' && await recover()) return;
        clearTimeout(timeout);
        if (['session_revoked', 'invalid_token'].includes(error.data?.code)) await expireSession(connectedSocket.accessToken);
        reject(error);
      });
      connectedSocket.connect();
    });
  }

  setupDefaultListeners() {
    for (const [event, callbacks] of this.listeners) {
      callbacks.forEach(callback => this.socket.on(event, callback));
    }
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
    this.unsubscribeToken?.();
    this.rooms.clear();
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
    this.rooms.add(conversationId);
    if (this.socket && this.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log('Joined conversation:', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    this.rooms.delete(conversationId);
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

  onNotificationCreated(callback) {
    this.on('notification_created', callback);
    return () => this.off('notification_created', callback);
  }

  // Event listeners
  on(event, callback) {
    // Store callbacks before connect so auth-ready notifications are not lost.
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Add listener to socket
    this.socket?.on(event, callback);
  }

  off(event, callback) {
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
    this.socket?.off(event, callback);
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

