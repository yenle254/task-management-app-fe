import apiClient from './api';

const messageService = {
  /**
   * Send a message
   * @param {string} receiverId
   * @param {string} message
   * @param {Array} attachments - Optional
   * @returns {Promise}
   */
  sendMessage: async (receiverId, message, attachments = []) => {
    try {
      const response = await apiClient.post('/messages', {
        receiverId,
        message,
        attachments,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all conversations
   * @returns {Promise}
   */
  getConversations: async () => {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get messages in a conversation
   * @param {string} conversationId
   * @param {number} page - Default: 1
   * @param {number} limit - Default: 50
   * @returns {Promise}
   */
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const response = await apiClient.get(`/messages/conversation/${conversationId}`, {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get conversation by user ID (find or create)
   * @param {string} userId
   * @returns {Promise}
   */
  getConversationByUser: async (userId) => {
    try {
      const response = await apiClient.get(`/messages/conversation/user/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark messages as read
   * @param {string} conversationId
   * @returns {Promise}
   */
  markAsRead: async (conversationId) => {
    try {
      const response = await apiClient.put(`/messages/${conversationId}/read`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a message
   * @param {string} messageId
   * @returns {Promise}
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await apiClient.delete(`/messages/${messageId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total unread message count
   * @returns {Promise}
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/messages/unread/count');
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default messageService;