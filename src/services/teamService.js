import apiClient from './api';

const teamService = {

  /**
   * Create a new team
   * @param {Object} teamData - { name, description, leaderId }
   * @returns {Promise}
   */
  createTeam: async (teamData) => {
    try {
      const response = await apiClient.post('/teams', teamData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all teams (with pagination)
   * @param {Object} params - { page, limit }
   * @returns {Promise}
   */
  getAllTeams: async (params = {}) => {
    try {
      const response = await apiClient.get('/teams', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team by ID
   * @param {string} id
   * @returns {Promise}
   */
  getTeamById: async (id) => {
    try {
      const response = await apiClient.get(`/teams/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update team info
   * @param {string} id
   * @param {Object} data - { name, description, leaderId }
   * @returns {Promise}
   */
  updateTeam: async (id, data) => {
    try {
      const response = await apiClient.put(`/teams/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete team
   * @param {string} id
   * @returns {Promise}
   */
  deleteTeam: async (id) => {
    try {
      const response = await apiClient.delete(`/teams/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a member to team
   * @param {string} teamId
   * @param {string} userId
   * @returns {Promise}
   */
  addMember: async (teamId, userId) => {
    try {
      const response = await apiClient.post(`/teams/${teamId}/members`, { userId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove member from team
   * @param {string} teamId
   * @param {string} userId
   * @returns {Promise}
   */
  removeMember: async (teamId, userId) => {
    try {
      const response = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Assign new team leader
   * @param {string} teamId
   * @param {string} leaderId
   * @returns {Promise}
   */
  assignTeamLead: async (teamId, leaderId) => {
    try {
      const response = await apiClient.put(`/teams/${teamId}/leader`, { leaderId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get members of a specific team
   * @param {string} teamId
   * @returns {Promise}
   */
  getTeamMembers: async (teamId) => {
    try {
    const response = await apiClient.get(`/teams/${teamId}/members`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all members (HR only)
   * @returns {Promise}
   */
  getAllMembers: async () => {
    try {
      const response = await apiClient.get(`/teams/members`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get available leaders (team_lead only) with leading status
   * @param {Object} params - { excludeTeamId }
   * @returns {Promise}
   */
  getAvailableLeaders: async (params = {}) => {
    try {
      const response = await apiClient.get(`/teams/available-leaders`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default teamService;