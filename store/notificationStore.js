import { create } from 'zustand';
import notificationService from '../src/services/notificationService';

let notificationGeneration = 0;
let notificationRevision = 0;
let listRequest = 0;

const useNotificationStore = create((set, get) => ({
  // States
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Request deduplication
  isFetchingUnread: false,
  unreadCooldownUntil: null, // Timestamp when cooldown ends

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
    const session = notificationGeneration, request = ++listRequest, revision = notificationRevision;
    set({ isLoading: true, error: null });
    try {
      const queryParams = {
        page: params.page || get().pagination.page,
        limit: params.limit || get().pagination.limit,
        unreadOnly: params.unreadOnly || false
      };
      
      const response = await notificationService.getNotifications(queryParams);
      
      if (session !== notificationGeneration || request !== listRequest) return response;
      const newNotifications = response.data || [];
      const isFirstPage = queryParams.page === 1;
      
      set(state => ({
        notifications: [...new Map((isFirstPage && revision === notificationRevision
          ? newNotifications : [...state.notifications, ...newNotifications]).map(item => [item._id, item])).values()],
        pagination: {
          ...state.pagination,
          page: queryParams.page,
          hasMore: newNotifications.length === queryParams.limit
        },
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      if (session !== notificationGeneration || request !== listRequest) return;
      set({ 
        error: error?.error || 'Failed to fetch notifications',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch unread notification count with deduplication and 429 handling
   * Backend response: { success: true, data: { unreadCount: number } }
   */
  fetchUnreadCount: async () => {
    const session = notificationGeneration, revision = notificationRevision;
    const { isFetchingUnread, unreadCooldownUntil } = get();
    const now = Date.now();

    // Skip if already fetching
    if (isFetchingUnread) {
      return;
    }

    // Skip if in cooldown from 429
    if (unreadCooldownUntil && now < unreadCooldownUntil) {
      return;
    }

    set({ isFetchingUnread: true });

    try {
      const response = await notificationService.getUnreadCount();

      if (session !== notificationGeneration) return;
      if (revision !== notificationRevision) { set({ isFetchingUnread: false }); return; }
      // Backend trả về: response.data.unreadCount
      const count = response.data?.unreadCount || 0;

      set({
        unreadCount: count,
        isFetchingUnread: false,
        unreadCooldownUntil: null
      });

      return response;
    } catch (error) {
      if (session !== notificationGeneration) return;
      // Check if it's a 429 error
      if (error?.error?.includes('Too many requests') ||
          error?.retryAfter ||
          (error?.response?.status === 429)) {

        // Parse retryAfter - could be in seconds or from headers
        const retrySeconds = error?.retryAfter || 900; // Default 15 minutes
        const cooldownMs = retrySeconds * 1000;

        console.log(`Rate limited. Cooldown for ${retrySeconds}s`);

        set({
          isFetchingUnread: false,
          unreadCooldownUntil: now + cooldownMs
        });
      } else {
        set({
          isFetchingUnread: false,
          unreadCooldownUntil: null
        });
        console.error('Failed to fetch unread count:', error);
      }

      // Don't throw - don't break UI
      return;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const session = notificationGeneration;
    notificationRevision++;
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
      if (session !== notificationGeneration) return;
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
    const session = notificationGeneration;
    notificationRevision++;
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
      if (session !== notificationGeneration) return;
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
    const session = notificationGeneration;
    notificationRevision++;
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
      if (session !== notificationGeneration) return;
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
    const session = notificationGeneration;
    notificationRevision++;
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
      if (session !== notificationGeneration) return;
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
   * Call this ONCE per app session (e.g., in App.js or root navigator)
   */
  startAutoRefresh: () => {
    // Stop existing interval if any
    get().stopAutoRefresh();

    // Fetch immediately
    get().fetchUnreadCount();

    // Set up new interval (30 seconds)
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
  handleRealtimeNotification: notification => get().addNotification(notification),
  addNotification: (notification) => {
    if (!notification?._id || get().notifications.some(item => item._id === notification._id)) return false;
    notificationRevision++;
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.isRead 
        ? state.unreadCount + 1 
        : state.unreadCount
    }));
    return true;
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
    notificationGeneration++; notificationRevision++; listRequest++;
    set({ isFetchingUnread: false, unreadCooldownUntil: null });
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