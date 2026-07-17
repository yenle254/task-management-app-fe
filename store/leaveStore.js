import { create } from 'zustand';
import leaveService from '../src/services/leaveService';


const useLeaveStore = create((set, get) => ({
  leaves: [],
  leaveBalance: {
    total: 12,
    used: 0,
    remaining: 12
  },
  pendingLeaves: [],
  isLoading: false,
  error: null,


  /**
   * Fetch all leaves for current user
   * @param {Object} params - {status, type, year}
   */
  fetchLeaves: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.getMyLeaves(params);
      set({ 
        leaves: response.data || [],
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch leaves',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Submit a new leave request
   * @param {Object} leaveData - {type, startDate, endDate, reason}
   */
  submitLeave: async (leaveData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.submitLeave(leaveData);
      const newLeave = response.data;
      
      set(state => ({
        leaves: [newLeave, ...state.leaves],
        isLoading: false
      }));

      await get().fetchLeaveBalance();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to submit leave',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Approve a leave request (Team Lead/HR Manager)
   * @param {string} leaveId
   */
  approveLeave: async (leaveId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.approveLeave(leaveId);
      const approvedLeave = response.data;
      
      set(state => ({
        leaves: state.leaves.map(leave => 
          leave._id === leaveId ? approvedLeave : leave
        ),
        pendingLeaves: state.pendingLeaves.filter(leave => leave._id !== leaveId),
        isLoading: false
      }));

      await get().fetchLeaveBalance();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to approve leave',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Reject a leave request (Team Lead/HR Manager)
   * @param {string} leaveId
   * @param {string} rejectionReason
   */
  rejectLeave: async (leaveId, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.rejectLeave(leaveId, rejectionReason);
      const rejectedLeave = response.data;
      
      set(state => ({
        leaves: state.leaves.map(leave => 
          leave._id === leaveId ? rejectedLeave : leave
        ),
        pendingLeaves: state.pendingLeaves.filter(leave => leave._id !== leaveId),
        isLoading: false
      }));

      await get().fetchLeaveBalance();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to reject leave',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Cancel own leave request
   * @param {string} leaveId
   */
  cancelLeave: async (leaveId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.cancelLeave(leaveId);
      
      set(state => ({
        leaves: state.leaves.filter(leave => leave._id !== leaveId),
        isLoading: false
      }));

      await get().fetchLeaveBalance();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to cancel leave',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch leave balance for current user
   * @param {number} year - Default: current year
   */
  fetchLeaveBalance: async (year = new Date().getFullYear()) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.getLeaveBalance(year);
      
      const backendBalance = response.data?.balance;
    
      const leaveBalance = {
        total: backendBalance?.total || 12,
        used: backendBalance?.used || 0,
        remaining: backendBalance?.remaining || 12
      };
      
      set({ 
        leaveBalance,
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch leave balance',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch pending leaves for approval
   */
  fetchPendingLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.getPendingLeaves();
      
      set({ 
        pendingLeaves: response.data || [],
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch pending leaves',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch team leaves
   * @param {string} teamId
   * @param {Object} params - {status, month, year}
   */
  fetchTeamLeaves: async (teamId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.getTeamLeaves(teamId, params);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch team leaves',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Get leave by ID
   * @param {string} leaveId
   */
  getLeaveById: async (leaveId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveService.getLeaveById(leaveId);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch leave details',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    leaves: [],
    leaveBalance: {
      totalAnnualLeave: 12,
      usedDays: 0,
      remainingDays: 12,
      byType: {
        sick: { total: 12, used: 0, remaining: 12 },
        vacation: { total: 12, used: 0, remaining: 12 },
        personal: { total: 12, used: 0, remaining: 12 }
      }
    },
    pendingLeaves: [],
    isLoading: false,
    error: null
  })
}));

export default useLeaveStore;

