import { create } from 'zustand';
import messageService from '../src/services/messageService';

/**
 * Message Store
 * Manages conversations and messages
 */
const useMessageStore = create((set, get) => ({
  conversations: [],
  messages: {}, // { conversationId: [messages] }
  currentConversation: null,
  unreadCount: 0,
  isLoading: false,
  error: null,



  /**
   * Send a message
   * @param {string} receiverId
   * @param {string} messageText
   * @param {Array} attachments - Optional
   */
  sendMessage: async (receiverId, messageText, attachments = []) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageService.sendMessage(receiverId, messageText, attachments);
      const newMessage = response.data;
      const conversationId = newMessage.conversationId;
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), newMessage]
        },
        isLoading: false
      }));

      await get().fetchConversations();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to send message',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch all conversations
   */
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageService.getConversations();
      
      set({ 
        conversations: response.data || [],
        isLoading: false 
      });

      const totalUnread = (response.data || []).reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      set({ unreadCount: totalUnread });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch conversations',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch messages in a conversation
   * @param {string} conversationId
   * @param {number} page - Default: 1
   * @param {number} limit - Default: 50
   */
  fetchMessages: async (conversationId, page = 1, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageService.getMessages(conversationId, page, limit);
      const fetchedMessages = response.data || [];
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: page === 1 ? fetchedMessages : [...(state.messages[conversationId] || []), ...fetchedMessages]
        },
        currentConversation: conversationId,
        isLoading: false
      }));

      await get().markAsRead(conversationId);
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch messages',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Get or create conversation by user ID
   * @param {string} userId
   */
  getConversationByUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageService.getConversationByUser(userId);
      const conversation = response.data;
      

      set(state => {
        const exists = state.conversations.find(c => c._id === conversation._id);
        if (!exists) {
          return {
            conversations: [conversation, ...state.conversations],
            isLoading: false
          };
        }
        return { isLoading: false };
      });
      
      return response;
    } catch (error) {
      set({ isLoading: false });
      return null;
    }
  },

  /**
   * Mark messages as read
   * @param {string} conversationId
   */
  markAsRead: async (conversationId) => {
    try {
      await messageService.markAsRead(conversationId);
      
      set(state => ({
        conversations: state.conversations.map(conv => 
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      }));

      await get().fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  /**
   * Delete a message
   * @param {string} messageId
   * @param {string} conversationId
   */
  deleteMessage: async (messageId, conversationId) => {
    set({ isLoading: true, error: null });
    try {
      await messageService.deleteMessage(messageId);
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.filter(msg => msg._id !== messageId) || []
        },
        isLoading: false
      }));

      await get().fetchConversations();
      
      return true;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to delete message',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch total unread count
   */
  fetchUnreadCount: async () => {
    try {
      const response = await messageService.getUnreadCount();
      set({ unreadCount: response.data?.unreadCount || 0 });
      return response;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  /**
   * Get messages for current conversation
   */
  getCurrentMessages: () => {
    const { currentConversation, messages } = get();
    return currentConversation ? messages[currentConversation] || [] : [];
  },

  /**
   * Set current conversation
   */
  setCurrentConversation: (conversationId) => {
    set({ currentConversation: conversationId });
  },

  /**
   * Clear current conversation
   */
  clearCurrentConversation: () => {
    set({ currentConversation: null });
  },

  /**
   * Add new message -------////// socket.io later
   * @param {Object} message
   */
  addMessage: (message) => {
    const conversationId = message.conversationId;
    
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message]
      }
    }));

    get().fetchConversations();
  },

  /**
   * Update conversation ------////// socket.io later
   * @param {Object} conversation
   */
  updateConversation: (conversation) => {
    set(state => ({
      conversations: state.conversations.map(conv => 
        conv._id === conversation._id ? { ...conv, ...conversation } : conv
      )
    }));
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    conversations: [],
    messages: {},
    currentConversation: null,
    unreadCount: 0,
    isLoading: false,
    error: null
  })
}));

export default useMessageStore;

