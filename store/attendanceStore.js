import { create } from 'zustand';
import attendanceService from '../src/services/attendanceService';

/**
 * Attendance Store
 * Manages clock-in/out, attendance records, and statistics
 */
const useAttendanceStore = create((set, get) => ({
  attendances: [],
  todayAttendance: null,
  stats: {
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalWorkHours: 0,
    averageWorkHours: 0
  },
  isLoading: false,
  error: null,



  /**
   * Clock in with location
   * @param {Object} location - {lat, lng}
   */
  clockIn: async (location) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.clockIn(location);
      const attendanceRecord = response.data;
      
      set({ 
        todayAttendance: attendanceRecord,
        attendances: [attendanceRecord, ...get().attendances],
        isLoading: false 
      });

      await Promise.all([
        get().fetchAttendanceStats(),
        get().fetchTodayAttendance()
      ]);
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || error?.error || 'Failed to clock in';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  /**
   * Clock out
   */
  clockOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.clockOut();
      const updatedAttendance = response.data;
      
      set(state => ({
        todayAttendance: updatedAttendance,
        attendances: state.attendances.map(att => 
          att._id === updatedAttendance._id ? updatedAttendance : att
        ),
        isLoading: false
      }));

      await get().fetchAttendanceStats();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.message || error?.error || 'Failed to clock out',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch attendance records
   * @param {Object} params - {startDate, endDate}
   */
  fetchAttendance: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getMyAttendance(params);
      const attendanceData = response.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attendanceData.find(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === today;
      });
      
      set({ 
        attendances: attendanceData,
        todayAttendance: todayRecord || get().todayAttendance,
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch attendance',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch today's attendance
   */
  fetchTodayAttendance: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getTodayAttendance();
      
      set({ 
        todayAttendance: response.data,
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch today attendance',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch attendance statistics
   */
  fetchAttendanceStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getAttendanceStats();
      
      set({ 
        stats: response.data || get().stats,
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch attendance stats',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch attendance by date
   * @param {string} date - Format: YYYY-MM-DD
   */
  getAttendanceByDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getAttendanceByDate(date);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch attendance by date',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch team attendance
   * @param {string} teamId
   * @param {Object} params - {startDate, endDate}
   */
  fetchTeamAttendance: async (teamId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendanceService.getTeamAttendance(teamId, params);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch team attendance',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Get attendance for a specific month (helper)
   * @param {number} year
   * @param {number} month - 1-12
   */
  fetchMonthAttendance: async (year, month) => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return await get().fetchAttendance({ startDate, endDate });
  },

  /**
   * Check if has no attendance record today
   */
  hasNoAttendanceToday: () => {
    const today = get().todayAttendance;
    return !today || !today.clockIn;
  },

  /**
   * Check if already clocked in today (but not clocked out)
   */
  isClockedInToday: () => {
    const today = get().todayAttendance;
    return today && today.clockIn && (!today.clockOut || today.clockOut === null);
  },

  /**
   * Check if already clocked out today
   */
  isClockedOutToday: () => {
    const today = get().todayAttendance;
    // Check if has both clockIn and clockOut
    return today && today.clockIn && today.clockOut && today.clockOut !== null;
  },

  /**
   * Get work hours for today
   */
  getTodayWorkHours: () => {
    const today = get().todayAttendance;
    if (!today || !today.clockIn) return 0;
    
    if (today.workHours) {
      return today.workHours;
    }
    
    if (!today.clockOut) {
      const clockIn = new Date(today.clockIn);
      const now = new Date();
      const hours = (now - clockIn) / (1000 * 60 * 60);
      return Math.max(0, hours);
    }
    
    return 0;
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    attendances: [],
    todayAttendance: null,
    stats: {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      totalWorkHours: 0,
      averageWorkHours: 0
    },
    isLoading: false,
    error: null
  })
}));

export default useAttendanceStore;

