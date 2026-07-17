import apiClient from './api';

const leaveService = {
  /**
   * Submit leave request
   * @param {Object} leaveData - {type, startDate, endDate, reason}
   * @returns {Promise}
   */
  submitLeave: async (leaveData) => {
    try {
      const response = await apiClient.post('/leaves', leaveData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user's leaves
   * @param {Object} params - {status, type, year}
   * @returns {Promise}
   */
  getMyLeaves: async (params = {}) => {
    try {
      const response = await apiClient.get('/leaves/my', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get leave by ID
   * @param {string} id
   * @returns {Promise}
   */
  getLeaveById: async (id) => {
    try {
      const response = await apiClient.get(`/leaves/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get pending leaves for approval
   * @returns {Promise}
   */
  getPendingLeaves: async () => {
    try {
      const response = await apiClient.get('/leaves/pending');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve leave request
   * @param {string} id
   * @returns {Promise}
   */
  approveLeave: async (id) => {
    try {
      const response = await apiClient.put(`/leaves/${id}/approve`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reject leave request
   * @param {string} id
   * @param {string} rejectionReason
   * @returns {Promise}
   */
  rejectLeave: async (id, rejectionReason) => {
    try {
      const response = await apiClient.put(`/leaves/${id}/reject`, { rejectionReason });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel own leave request
   * @param {string} id
   * @returns {Promise}
   */
  cancelLeave: async (id) => {
    try {
      const response = await apiClient.delete(`/leaves/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get leave balance
   * @param {number} year - Default: current year
   * @returns {Promise}
   */
  getLeaveBalance: async (year) => {
    try {
      const params = year ? { year } : {};
      const response = await apiClient.get('/leaves/balance', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team leaves
   * @param {string} teamId
   * @param {Object} params - {status, month, year}
   * @returns {Promise}
   */
  getTeamLeaves: async (teamId, params = {}) => {
    try {
      const response = await apiClient.get(`/leaves/team/${teamId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default leaveService;
