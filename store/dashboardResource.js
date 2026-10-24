import { createStore } from 'zustand/vanilla';
import { errorMessage } from '../src/utils/dashboardData';

// Per-mounted-dashboard store: private data never survives a user/role change.
// Reuses Zustand and the existing five-minute cache convention.
export function createDashboardResource() {
  const cache = new Map();
  const pending = new Map();
  let generation = 0;
  const store = createStore(() => ({ key: null, status: 'loading', data: null, error: null }));
  const load = async (key, fetcher, force = false) => {
    const request = ++generation;
    if (force) cache.delete(key);
    const cached = cache.get(key);
    if (!force && cached && Date.now() - cached.time < 300000) {
      store.setState({ key, status: 'ready', data: cached.data, error: null });
      return;
    }
    store.setState({ key, status: 'loading', data: null, error: null });
    let promise = pending.get(key);
    if (!promise) {
      promise = Promise.resolve().then(fetcher);
      pending.set(key, promise);
    }
    try {
      const data = await promise;
      cache.set(key, { data, time: Date.now() });
      if (cache.size > 12) cache.delete(cache.keys().next().value);
      if (request === generation) store.setState({ key, status: 'ready', data, error: null });
    } catch (error) {
      if (request === generation) store.setState({ key, status: 'error', data: null, error: errorMessage(error) });
    } finally {
      if (pending.get(key) === promise) pending.delete(key);
    }
  };
  return { store, load, cancel: () => { generation += 1; } };
}
