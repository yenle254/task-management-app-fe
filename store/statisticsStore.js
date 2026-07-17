import { create } from "zustand";
import statisticsService from "../src/services/statisticsService";

/**
 * Statistics Store
 * Manages HR Dashboard statistics with caching
 */
const useStatisticsStore = create((set, get) => ({
  // Data states
  overview: null,
  taskStats: null,
  leaveStats: null,
  attendanceStats: null,
  teamPerformance: [],

  // Loading states
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Cache metadata
  lastFetchTime: null,
  cacheExpiry: 5 * 60 * 1000, 

  /**
   * Check if cache is still valid
   */
  isCacheValid: () => {
    const { lastFetchTime, cacheExpiry } = get();
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime < cacheExpiry;
  },

  /**
   * Load all statistics (with cache check)
   * @param {boolean} forceRefresh - Bỏ qua cache và fetch mới
   */
  loadAllStats: async (forceRefresh = false) => {
    const { isCacheValid, isLoading, isRefreshing } = get();

    // Nếu đang loading hoặc refreshing thì skip
    if (isLoading || isRefreshing) {
      return;
    }

    // Nếu có cache valid và không force refresh thì return data có sẵn
    if (!forceRefresh && isCacheValid()) {
      console.log("Using cached HR dashboard data");
      return {
        success: true,
        fromCache: true,
      };
    }

    // Set loading state
    set({
      isLoading: !forceRefresh,
      isRefreshing: forceRefresh,
      error: null,
    });

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      console.log("Fetching fresh HR dashboard data...");

      const [overviewRes, taskRes, leaveRes, teamRes, attendanceRes] =
        await Promise.all([
          statisticsService.getOverviewStats(),
          statisticsService.getTaskStats(),
          statisticsService.getLeaveStats(year),
          statisticsService.getTeamPerformance(),
          statisticsService.getAttendanceStats(month, year),
        ]);

      set({
        overview: overviewRes.data,
        taskStats: taskRes.data,
        leaveStats: leaveRes.data,
        teamPerformance: teamRes.data,
        attendanceStats: attendanceRes.data,
        lastFetchTime: Date.now(),
        isLoading: false,
        isRefreshing: false,
        error: null,
      });

      console.log("HR dashboard data loaded successfully");

      return {
        success: true,
        fromCache: false,
      };
    } catch (error) {
      console.error("Error loading HR stats:", error);

      set({
        error: error?.error || "Failed to load statistics",
        isLoading: false,
        isRefreshing: false,
      });

      throw error;
    }
  },

  /**
   * Refresh statistics (force fetch)
   */
  refreshStats: async () => {
    return await get().loadAllStats(true);
  },

  /**
   * Load specific stat
   */
  loadOverviewStats: async () => {
    try {
      const response = await statisticsService.getOverviewStats();
      set({ overview: response.data });
      return response;
    } catch (error) {
      console.error("Error loading overview stats:", error);
      throw error;
    }
  },

  loadTaskStats: async () => {
    try {
      const response = await statisticsService.getTaskStats();
      set({ taskStats: response.data });
      return response;
    } catch (error) {
      console.error("Error loading task stats:", error);
      throw error;
    }
  },

  loadLeaveStats: async (year = new Date().getFullYear()) => {
    try {
      const response = await statisticsService.getLeaveStats(year);
      set({ leaveStats: response.data });
      return response;
    } catch (error) {
      console.error("Error loading leave stats:", error);
      throw error;
    }
  },

  loadAttendanceStats: async (month, year) => {
    try {
      const response = await statisticsService.getAttendanceStats(month, year);
      set({ attendanceStats: response.data });
      return response;
    } catch (error) {
      console.error("Error loading attendance stats:", error);
      throw error;
    }
  },

  loadTeamPerformance: async () => {
    try {
      const response = await statisticsService.getTeamPerformance();
      set({ teamPerformance: response.data });
      return response;
    } catch (error) {
      console.error("Error loading team performance:", error);
      throw error;
    }
  },

  /**
   * Set cache expiry time
   * @param {number} milliseconds
   */
  setCacheExpiry: (milliseconds) => {
    set({ cacheExpiry: milliseconds });
  },

  /**
   * Clear cache
   */
  clearCache: () => {
    set({ lastFetchTime: null });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store
   */
  reset: () => {
    set({
      overview: null,
      taskStats: null,
      leaveStats: null,
      attendanceStats: null,
      teamPerformance: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetchTime: null,
      cacheExpiry: 5 * 60 * 1000,
    });
  },
}));

export default useStatisticsStore;