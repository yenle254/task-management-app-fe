import apiClient from './api';

const notificationService = {
  /**
   * Get all notifications
   * @param {Object} params - {page, limit, unreadOnly}
   * @returns {Promise}
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/notifications', { params });
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise}
   */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread/count');
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Get notifications by type
   * @param {string} type
   * @param {Object} params - {page, limit}
   * @returns {Promise}
   */
  getNotificationsByType: async (type, params = {}) => {
    try {
      const response = await apiClient.get(`/notifications/type/${type}`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching notifications by type ${type}:`, error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise}
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId
   * @returns {Promise}
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete all notifications
   * @returns {Promise}
   */
  deleteAllNotifications: async () => {
    try {
      const response = await apiClient.delete('/notifications');
      return response;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },
};

export default notificationService;