import { create } from 'zustand';
import notificationService from '../src/services/notificationService';

let generation = 0;
let revision = 0;
let fetching;
let saving;
const useNotificationPreferencesStore = create((set, get) => ({
  preferences: null, isLoading: false, isSaving: false, error: null,
  fetchPreferences: () => {
    if (fetching) return fetching;
    const session = generation, requestedRevision = revision;
    set({ isLoading: true, error: null });
    const request = notificationService.getPreferences().then(response => {
      if (session === generation) set({ ...(requestedRevision === revision ? { preferences: response.data } : {}), isLoading: false });
      return response.data;
    }).catch(error => {
      if (session === generation) set({ error: error?.error || 'Unable to load notification settings', isLoading: false });
      throw error;
    }).finally(() => { if (fetching === request) fetching = null; });
    fetching = request;
    return request;
  },
  updatePreferences: patch => {
    if (saving) return saving;
    revision++;
    const session = generation;
    set({ isSaving: true, error: null });
    const request = notificationService.updatePreferences(patch).then(response => {
      if (session === generation) set({ preferences: response.data, isSaving: false });
      return response.data;
    }).catch(error => {
      if (session === generation) set({ error: error?.error || 'Unable to save notification settings', isSaving: false });
      throw error;
    }).finally(() => { if (saving === request) saving = null; });
    saving = request;
    return request;
  },
  reset: () => {
    generation++; revision++; fetching = null; saving = null;
    set({ preferences: null, isLoading: false, isSaving: false, error: null });
  }
}));
export default useNotificationPreferencesStore;
