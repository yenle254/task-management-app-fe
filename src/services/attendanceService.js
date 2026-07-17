import apiClient from './api';

const attendanceService = {
  /**
   * Clock in
   * @param {Object} location - {lat, lng}
   * @returns {Promise}
   */
  clockIn: async (location) => {
    try {
      // Backend expects { lat, lng } not { location: { lat, lng } }
      const response = await apiClient.post('/attendance/clockin', {
        lat: location.lat,
        lng: location.lng
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clock out
   * @returns {Promise}
   */
  clockOut: async () => {
    try {
      const response = await apiClient.post('/attendance/clockout');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user's attendance
   * @param {Object} params - {startDate, endDate}
   * @returns {Promise}
   */
  getMyAttendance: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/my', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get today's attendance
   * @returns {Promise}
   */
  getTodayAttendance: async () => {
    try {
      const response = await apiClient.get('/attendance/today');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get attendance statistics
   * @returns {Promise}
   */
  getAttendanceStats: async () => {
    try {
      const response = await apiClient.get('/attendance/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get attendance by date
   * @param {string} date - Format: YYYY-MM-DD
   * @returns {Promise}
   */
  getAttendanceByDate: async (date) => {
    try {
      const response = await apiClient.get(`/attendance/date/${date}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team attendance
   * @param {string} teamId
   * @param {Object} params - {startDate, endDate}
   * @returns {Promise}
   */
  getTeamAttendance: async (teamId, params = {}) => {
    try {
      const response = await apiClient.get(`/attendance/team/${teamId}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default attendanceService;




