import { create } from "zustand";
import userService from "../src/services/userService";

/**
 * User Store
 * Manages user data and operations
 */
const useUserStore = create((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false, 
  isLoadingMore: false, 
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  /**
   * Fetch all users
   * @param {Object} params - {page, limit, search, role, department}
   * @param {boolean} isLoadMore 
   */
  fetchUsers: async (params = {}, isLoadMore = false) => {
    if (isLoadMore) {
      set({ isLoadingMore: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await userService.getAllUsers(params);

      const newUsers = response.data || [];
      const newPagination = response.pagination || get().pagination;

      set((state) => ({
        users: isLoadMore ? [...state.users, ...newUsers] : newUsers,
        pagination: newPagination,
        isLoading: false,
        isLoadingMore: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to fetch users",
        isLoading: false,
        isLoadingMore: false,
      });
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  fetchUserById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getUserById(id);
      set({
        currentUser: response.data,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to fetch user",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Update user
   */
  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.updateUser(id, data);
      const updatedUser = response.data;

      set((state) => ({
        users: state.users.map((user) =>
          user._id === id ? updatedUser : user
        ),
        currentUser:
          state.currentUser?._id === id ? updatedUser : state.currentUser,
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to update user",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Delete user
   */
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(id);

      set((state) => ({
        users: state.users.filter((user) => user._id !== id),
        currentUser: state.currentUser?._id === id ? null : state.currentUser,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: error?.error || "Failed to delete user",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Get users by team
   */
  fetchUsersByTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getUsersByTeam(teamId);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({
        error: error?.error || "Failed to fetch team users",
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Set current user
   */
  setCurrentUser: (user) => set({ currentUser: user }),

  /**
   * Clear current user
   */
  clearCurrentUser: () => set({ currentUser: null }),

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () =>
    set({
      users: [],
      currentUser: null,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
    }),
}));

export default useUserStore;
