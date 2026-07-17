import { create } from 'zustand';
import notificationService from '../src/services/notificationService';

const useNotificationStore = create((set, get) => ({
  // States
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  // Auto-refresh interval ID
  refreshInterval: null,
  
  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    hasMore: true
  },

  /**
   * Fetch all notifications
   */
  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = {
        page: params.page || get().pagination.page,
        limit: params.limit || get().pagination.limit,
        unreadOnly: params.unreadOnly || false
      };
      
      const response = await notificationService.getNotifications(queryParams);
      
      const newNotifications = response.data || [];
      const isFirstPage = queryParams.page === 1;
      
      set(state => ({
        notifications: isFirstPage 
          ? newNotifications 
          : [...state.notifications, ...newNotifications],
        pagination: {
          ...state.pagination,
          page: queryParams.page,
          hasMore: newNotifications.length === queryParams.limit
        },
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch notifications',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch unread notification count
   * Backend response: { success: true, data: { unreadCount: number } }
   */
  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount();
      
      // Backend trả về: response.data.unreadCount
      const count = response.data?.unreadCount || 0;
      
      set({ unreadCount: count });
      
      return response;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Không throw error để không break UI
      set({ unreadCount: 0 });
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const oldNotifications = get().notifications;
    const oldUnreadCount = get().unreadCount;
    
    const notification = oldNotifications.find(n => n._id === notificationId);
    const wasUnread = notification && !notification.isRead;
    
    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(notif => 
        notif._id === notificationId 
          ? { ...notif, isRead: true } 
          : notif
      ),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
    }));
    
    try {
      const response = await notificationService.markAsRead(notificationId);
      return response;
    } catch (error) {
      // Rollback
      set({ 
        notifications: oldNotifications,
        unreadCount: oldUnreadCount,
        error: error?.error || 'Failed to mark notification as read' 
      });
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const oldNotifications = get().notifications;
    const oldUnreadCount = get().unreadCount;
    
    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(notif => ({
        ...notif,
        isRead: true
      })),
      unreadCount: 0
    }));
    
    try {
      const response = await notificationService.markAllAsRead();
      return response;
    } catch (error) {
      // Rollback
      set({ 
        notifications: oldNotifications,
        unreadCount: oldUnreadCount,
        error: error?.error || 'Failed to mark all notifications as read'
      });
      throw error;
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    const oldNotifications = get().notifications;
    const oldUnreadCount = get().unreadCount;
    
    const notification = oldNotifications.find(n => n._id === notificationId);
    const wasUnread = notification && !notification.isRead;
    
    // Optimistic update
    set(state => ({
      notifications: state.notifications.filter(notif => 
        notif._id !== notificationId
      ),
      unreadCount: wasUnread 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount
    }));
    
    try {
      const response = await notificationService.deleteNotification(notificationId);
      return response;
    } catch (error) {
      // Rollback
      set({ 
        notifications: oldNotifications,
        unreadCount: oldUnreadCount,
        error: error?.error || 'Failed to delete notification'
      });
      throw error;
    }
  },

  /**
   * Delete all notifications
   */
  deleteAllNotifications: async () => {
    const oldNotifications = get().notifications;
    const oldUnreadCount = get().unreadCount;
    
    // Optimistic update
    set({ 
      notifications: [],
      unreadCount: 0
    });
    
    try {
      const response = await notificationService.deleteAllNotifications();
      return response;
    } catch (error) {
      // Rollback
      set({ 
        notifications: oldNotifications,
        unreadCount: oldUnreadCount,
        error: error?.error || 'Failed to delete all notifications'
      });
      throw error;
    }
  },

  /**
   * Load more notifications (pagination)
   */
  loadMore: async () => {
    const { pagination, isLoading } = get();
    
    if (isLoading || !pagination.hasMore) return;
    
    await get().fetchNotifications({
      page: pagination.page + 1
    });
  },

  /**
   * Refresh notifications
   */
  refresh: async () => {
    set(state => ({
      pagination: {
        ...state.pagination,
        page: 1
      }
    }));
    
    await get().fetchNotifications({ page: 1 });
    await get().fetchUnreadCount();
  },

  /**
   * Start auto-refresh (every 30 seconds)
   */
  startAutoRefresh: () => {
    const existingInterval = get().refreshInterval;
    if (existingInterval) {
      clearInterval(existingInterval);
    }
    
    // Fetch immediately
    get().fetchUnreadCount();
    
    // Set up new interval
    const intervalId = setInterval(() => {
      get().fetchUnreadCount();
    }, 30000);
    
    set({ refreshInterval: intervalId });
  },

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh: () => {
    const intervalId = get().refreshInterval;
    if (intervalId) {
      clearInterval(intervalId);
      set({ refreshInterval: null });
    }
  },

  /**
   * Add new notification (for real-time updates)
   */
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.isRead 
        ? state.unreadCount + 1 
        : state.unreadCount
    }));
  },

  /**
   * Update notification
   */
  updateNotification: (notificationId, updates) => {
    set(state => ({
      notifications: state.notifications.map(notif =>
        notif._id === notificationId
          ? { ...notif, ...updates }
          : notif
      )
    }));
  },

  /**
   * Get unread notifications
   */
  getUnreadNotifications: () => {
    return get().notifications.filter(notif => !notif.isRead);
  },

  /**
   * Get notifications by type
   */
  getNotificationsByType: (type) => {
    return get().notifications.filter(notif => notif.type === type);
  },

  /**
   * Get recent notifications
   */
  getRecentNotifications: () => {
    return get().notifications.slice(0, 5);
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store
   */
  reset: () => {
    get().stopAutoRefresh();
    
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      refreshInterval: null,
      pagination: {
        page: 1,
        limit: 20,
        hasMore: true
      }
    });
  }
}));

export default useNotificationStore;