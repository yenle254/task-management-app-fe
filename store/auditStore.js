import { create } from 'zustand';
import auditService from '../src/services/auditService';

export const auditError = error => /not authorized|permission|forbidden/i.test(error?.error || '')
  ? 'You do not have permission' : error?.error || 'Unable to load audit logs';
let generation = 0;
let sequence = 0;
const initial = () => ({ records: [], filters: {}, page: 0, pages: 0, total: 0, isLoading: false, error: null, requestedPage: 1 });
const useAuditStore = create((set, get) => ({
  ...initial(),
  setFilters: filters => {
    sequence++;
    set({ ...initial(), filters: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) });
  },
  fetchAuditLogs: async (page = 1) => {
    const session = generation, request = ++sequence;
    const filters = { ...get().filters };
    set({ isLoading: true, error: null, requestedPage: page });
    try {
      const response = await auditService.getAuditLogs({ ...filters, page, limit: 10 });
      if (session !== generation || request !== sequence) return;
      set(state => ({ records: page === 1 ? response.data : [...state.records, ...response.data.filter(item => !state.records.some(old => old._id === item._id))],
        page: response.page, pages: response.pages, total: response.total, isLoading: false }));
    } catch (error) {
      if (session === generation && request === sequence) set({ error: auditError(error), isLoading: false });
    }
  },
  reset: () => { generation++; sequence++; set(initial()); },
}));
export default useAuditStore;
