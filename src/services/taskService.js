import apiClient from './api';

const taskService = {
  /**
   * Create a new task
   * @param {Object} taskData - {title, description, teamId, assignedTo, priority, dueDate, startDate, tags}
   * @returns {Promise}
   */
  createTask: async (taskData) => {
    try {
      const response = await apiClient.post('/tasks', taskData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all tasks with filters
   * @param {Object} params - {page, limit, status, priority, teamId, search}
   * @returns {Promise}
   */
  getAllTasks: async (params = {}) => {
    try {
      const response = await apiClient.get('/tasks', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get task by ID
   * @param {string} id
   * @returns {Promise}
   */
  getTaskById: async (id) => {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update task
   * @param {string} id
   * @param {Object} updateData - {title, description, priority, dueDate, startDate, tags}
   * @returns {Promise}
   */
  updateTask: async (id, updateData) => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete task
   * @param {string} id
   * @returns {Promise}
   */
  deleteTask: async (id) => {
    try {
      const response = await apiClient.delete(`/tasks/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Assign task to users
   * @param {string} id
   * @param {Array} assignedTo - Array of user IDs
   * @returns {Promise}
   */
  assignTask: async (id, assignedTo) => {
    try {
      const response = await apiClient.post(`/tasks/${id}/assign`, { assignedTo });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update task status
   * @param {string} id
   * @param {string} status - 'todo', 'in_progress', 'done'
   * @returns {Promise}
   */
  updateTaskStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/tasks/${id}/status`, { status });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update task progress
   * @param {string} id
   * @param {number} progress - 0-100
   * @returns {Promise}
   */
  updateTaskProgress: async (id, progress) => {
    try {
      const response = await apiClient.put(`/tasks/${id}/progress`, { progress });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tasks assigned to current user
   * @param {Object} params - {page, limit, status, priority}
   * @returns {Promise}
   */
  getMyTasks: async (params = {}) => {
    try {
      const response = await apiClient.get('/tasks/my', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team tasks
   * @param {string} teamId
   * @param {Object} params - {page, limit, status}
   * @returns {Promise}
   */
  getTeamTasks: async (teamId, params = {}) => {
    try {
      const response = await apiClient.get(`/tasks/team/${teamId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add comment to task
   * @param {string} id
   * @param {string} text
   * @returns {Promise}
   */
  addComment: async (id, text) => {
    try {
      const response = await apiClient.post(`/tasks/${id}/comments`, { text });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add attachment to task
   * @param {string} id
   * @param {FormData} formData - Contains file
   * @returns {Promise}
   */
  addAttachment: async (id, formData) => {
    try {
      const response = await apiClient.post(`/tasks/${id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get overdue tasks
   * @param {Object} params - {forTeam}
   * @returns {Promise}
   */
  getOverdueTasks: async (params = {}) => {
    try {
      const response = await apiClient.get('/tasks/overdue', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get task statistics
   * @returns {Promise}
   */
  getTaskStats: async () => {
    try {
      const response = await apiClient.get('/tasks/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // ========== SUBTASK OPERATIONS ==========

  /**
   * Get all subtasks for a task
   * @param {string} taskId
   * @returns {Promise}
   */
  getSubtasks: async (taskId) => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}/subtasks`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new subtask
   * @param {string} taskId
   * @param {string} title - Subtask title
   * @returns {Promise}
   */
  createSubtask: async (taskId, title) => {
    try {
      const response = await apiClient.post(`/tasks/${taskId}/subtasks`, { title });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle subtask completion status
   * @param {string} taskId
   * @param {string} subtaskId
   * @returns {Promise}
   */
  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update subtask (title and/or status)
   * @param {string} taskId
   * @param {string} subtaskId
   * @param {Object} updateData - { title, isCompleted }
   * @returns {Promise}
   */
  updateSubtask: async (taskId, subtaskId, updateData) => {
    try {
      const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, updateData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a subtask
   * @param {string} taskId
   * @param {string} subtaskId
   * @returns {Promise}
   */
  deleteSubtask: async (taskId, subtaskId) => {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default taskService;