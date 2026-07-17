import { create } from "zustand";
import teamService from "../src/services/teamService";

/**
 * Team Store
 * Manages team data and operations
 */
const useTeamStore = create((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,

  /**
   * Fetch all teams
   * @param {Object} params - {page, limit}
   */
  fetchTeams: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.getAllTeams(params);
      set({
        teams: response.data || [],
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to fetch teams",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Get team by ID
   * @param {string} id
   */
  fetchTeamById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.getTeamById(id);
      set({
        currentTeam: response.data,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to fetch team",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Create new team
   * @param {Object} data - {name, description, leaderId}
   */
  createTeam: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.createTeam(data);
      const newTeam = response.data;

      set((state) => ({
        teams: [newTeam, ...state.teams],
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to create team",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update team
   * @param {string} id
   * @param {Object} data
   */
  updateTeam: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.updateTeam(id, data);
      const updatedTeam = response.data;

      set((state) => ({
        teams: state.teams.map((team) =>
          team._id === id ? updatedTeam : team
        ),
        currentTeam:
          state.currentTeam?._id === id ? updatedTeam : state.currentTeam,
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to update team",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete team
   * @param {string} id
   */
  deleteTeam: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.deleteTeam(id);

      set((state) => ({
        teams: state.teams.filter((team) => team._id !== id),
        currentTeam: state.currentTeam?._id === id ? null : state.currentTeam,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: error?.error || "Failed to delete team",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Add member to team
   * @param {string} teamId
   * @param {string} userId
   */
  addMember: async (teamId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.addMember(teamId, userId);
      const updatedTeam = response.data;

      set((state) => ({
        teams: state.teams.map((team) =>
          team._id === teamId ? updatedTeam : team
        ),
        currentTeam:
          state.currentTeam?._id === teamId ? updatedTeam : state.currentTeam,
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to add member",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Remove member from team
   * @param {string} teamId
   * @param {string} userId
   */
  removeMember: async (teamId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.removeMember(teamId, userId);
      const updatedTeam = response.data;

      set((state) => ({
        teams: state.teams.map((team) =>
          team._id === teamId ? updatedTeam : team
        ),
        currentTeam:
          state.currentTeam?._id === teamId ? updatedTeam : state.currentTeam,
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to remove member",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Set current team
   */
  setCurrentTeam: (team) => set({ currentTeam: team }),

  /**
   * Clear current team
   */
  clearCurrentTeam: () => set({ currentTeam: null }),

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () =>
    set({
      teams: [],
      currentTeam: null,
      isLoading: false,
      error: null,
    }),
}));

export default useTeamStore;
