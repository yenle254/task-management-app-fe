import { create } from 'zustand';
import {
  buildWelcomeMessage,
  getDefaultQuickPrompts
} from '../src/config/aiPrompts.config';

const useAICopilotStore = create((set, get) => ({
  activeUserId: null,
  messages: [],
  quickPrompts: [],
  completedActions: {},

  ensureSession: (user) => {
    const userId = user?._id || null;
    if (get().activeUserId !== userId || get().messages.length === 0) {
      set({
        activeUserId: userId,
        messages: [buildWelcomeMessage(user)],
        quickPrompts: getDefaultQuickPrompts(user?.role),
        completedActions: {}
      });
    }
  },

  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),

  setQuickPrompts: (prompts) =>
    set({
      quickPrompts: prompts
    }),

  markActionCompleted: (messageId, resultInfo) =>
    set((state) => ({
      completedActions: {
        ...state.completedActions,
        [messageId]: resultInfo
      }
    })),

  resetConversation: (user) =>
    set({
      activeUserId: user?._id || null,
      messages: [buildWelcomeMessage(user)],
      quickPrompts: getDefaultQuickPrompts(user?.role),
      completedActions: {}
    })
}));

export default useAICopilotStore;

