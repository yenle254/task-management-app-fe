import apiClient from './api';

const officeService = {
  /**
   * Get all offices
   * @returns {Promise}
   */
  getAllOffices: async () => {
    try {
      const response = await apiClient.get('/offices');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get active office
   * @returns {Promise}
   */
  getActiveOffice: async () => {
    try {
      const response = await apiClient.get('/offices/active');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new office
   * @param {Object} officeData - { name, address, location, radius, workingHours, isActive }
   * @returns {Promise}
   */
  createOffice: async (officeData) => {
    try {
      const response = await apiClient.post('/offices', officeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an office
   * @param {string} id - Office ID
   * @param {Object} data - { name, address, location, radius, workingHours, isActive }
   * @returns {Promise}
   */
  updateOffice: async (id, data) => {
    try {
      const response = await apiClient.put(`/offices/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an office
   * @param {string} id - Office ID
   * @returns {Promise}
   */
  deleteOffice: async (id) => {
    try {
      const response = await apiClient.delete(`/offices/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Set office as active
   * @param {string} id - Office ID
   * @returns {Promise}
   */
  setActiveOffice: async (id) => {
    try {
      const response = await apiClient.put(`/offices/${id}/activate`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default officeService;
