import apiClient from './api';

const adminService = {
  /**
   * Create HR Manager account
   * @param {Object} data - { email, password, profile: { fullName, employeeId, department, position, phone } }
   * @returns {Promise}
   */
  createHRAccount: async (data) => {
    try {
      const response = await apiClient.post('/admin/hr-accounts', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default adminService;
