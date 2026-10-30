import { create } from 'zustand';
import leaveService from '../src/services/leaveService';

const initial = () => ({ leaves: [], pendingLeaves: [], leaveBalance: { total: 12, used: 0, remaining: 12 },
  isLoading: false, isMutating: false, error: null });
let epoch = 0, reads = {}, pending = 0;
const mutations = new Map();
const useLeaveStore = create((set, get) => {
  const read = async (key, work, apply) => {
    const session = epoch, sequence = (reads[key] || 0) + 1; reads[key] = sequence;
    pending++; set({ isLoading: true, error: null });
    try {
      const response = await work(() => session === epoch && reads[key] === sequence);
      if (session === epoch && reads[key] === sequence) set(apply(response));
      return response;
    } catch (error) {
      if (session === epoch && reads[key] === sequence) set({ error: error?.error || error.message || 'Request failed' });
      throw error;
    } finally {
      if (session === epoch) { pending--; set({ isLoading: pending > 0 }); }
    }
  };
  const mutate = (key, work) => {
    if (mutations.has(key)) return mutations.get(key);
    const session = epoch;
    set({ isMutating: true, error: null });
    const promise = (async () => {
      try {
        const response = await work();
        if (session === epoch) {
          const changed = response.data;
          set(state => ({ leaves: state.leaves.map(item => item._id === changed._id ? changed : item),
            pendingLeaves: state.pendingLeaves.filter(item => item._id !== changed._id) }));
          await Promise.allSettled([get().fetchLeaves(), get().fetchLeaveBalance()]);
        }
        return response;
      } catch (error) {
        if (session === epoch) {
          await Promise.allSettled([get().fetchLeaves(), get().fetchPendingLeaves(get().pendingParams || {})]);
          if (session === epoch) set({ error: error?.error || error.message || 'Request failed; refresh and retry' });
        }
        throw error;
      } finally {
        if (session === epoch) { mutations.delete(key); set({ isMutating: mutations.size > 0 }); }
      }
    })();
    mutations.set(key, promise);
    return promise;
  };
  return {
    ...initial(),
    fetchLeaves: (params = {}) => read('leaves', async current => {
      // Consume the paginated contract, retaining the existing personal status tabs.
      let page = 1, data = [], response;
      do {
        response = await leaveService.getMyLeaves({ ...params, page, limit: 100 });
        data.push(...(response.data || [])); page++;
      } while (current() && page <= (response.pages || 1));
      return { ...response, data };
    }, response => ({ leaves: response.data || [] })),
    fetchLeaveBalance: year => read('balance', () => leaveService.getLeaveBalance(year), response => ({
      leaveBalance: { total: response.data?.balance?.total ?? 12, used: response.data?.balance?.used ?? 0,
        remaining: response.data?.balance?.remaining ?? 12 }
    })),
    fetchPendingLeaves: (params = {}) => {
      set({ pendingParams: params });
      return read('pending', () => leaveService.getPendingLeaves(params), response => ({ pendingLeaves: response.data || [] }));
    },
    submitLeave: data => mutate('create', () => leaveService.submitLeave(data)),
    submitDraft: (id, data) => mutate(id, () => leaveService.submitDraft(id, data)),
    editLeave: (id, data) => mutate(id, () => leaveService.editLeave(id, data)),
    approveLeave: (id, revision) => mutate(id, () => leaveService.approveLeave(id, revision)),
    rejectLeave: (id, reason, revision) => mutate(id, () => leaveService.rejectLeave(id, reason, revision)),
    cancelLeave: (id, revision) => mutate(id, () => leaveService.cancelLeave(id, revision)),
    getLeaveById: id => leaveService.getLeaveById(id),
    fetchTeamLeaves: (id, params) => leaveService.getTeamLeaves(id, params),
    clearError: () => set({ error: null }),
    reset: () => { epoch++; reads = {}; pending = 0; mutations.clear(); set({ ...initial(), pendingParams: {} }); }
  };
});
export default useLeaveStore;
