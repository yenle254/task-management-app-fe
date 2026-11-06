import apiClient from '../../../src/services/api';

const aiService = {
  /**
   * Chat with the internal RBAC-aware AI HR & Task Copilot
   * @param {string} message
   * @param {Array<{role: string, content: string}>} history
   * @returns {Promise<Object>}
   */
  askAssistant: async (message, history = []) => {
    return await apiClient.post('/ai/assistant', { message, history }, { timeout: 45000 });
  },

  /**
   * Generate AI Task Breakdown (subTasks, checklist, difficulty, priority, estimatedMinutes, storyPoints, tags)
   * @param {Object} payload - { title, description }
   * @returns {Promise<Object>}
   */
  breakdownTask: async ({ title, description = '' }) => {
    return await apiClient.post('/ai/task-breakdown', { title, description }, { timeout: 45000 });
  },

  /**
   * Summarize Task status, blockers, dependencies, statusHistory, and recent comments
   * @param {string} taskId
   * @returns {Promise<Object>}
   */
  summarizeTask: async (taskId) => {
    return await apiClient.post(`/ai/task-summary/${taskId}`, {}, { timeout: 45000 });
  }
};

export default aiService;

