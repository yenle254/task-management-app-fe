import apiClient from "./api";

const userService = {
  /**
   * Get all users
   * @param {Object} params - {page, limit, search, role, department}
   * @returns {Promise}
   */
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get("/users", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {string} id
   * @returns {Promise}
   */
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user
   * @param {string} id
   * @param {Object} data
   * @returns {Promise}
   */
  updateUser: async (id, data) => {
    try {
      const response = await apiClient.put(`/users/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete user (soft delete)
   * @param {string} id
   * @returns {Promise}
   */
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get users by team
   * @param {string} teamId
   * @returns {Promise}
   */
  getUsersByTeam: async (teamId) => {
    try {
      const response = await apiClient.get(`/users/team/${teamId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
