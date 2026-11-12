import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { subscribeTaskReview } from '../utils/taskReviewEvents';
import { createDashboardResource } from '../../store/dashboardResource';

export default function useDashboardResource(key, fetcher, enabled = true) {
  const resource = useMemo(createDashboardResource, []);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const state = useStore(resource.store);
  const reload = useCallback(() => enabled ? resource.load(key, fetchRef.current, true) : Promise.resolve(), [resource, key, enabled]);
  useEffect(() => {
    if (enabled) resource.load(key, fetchRef.current);
    return resource.cancel;
  }, [resource, key, enabled]);
  useEffect(() => subscribeTaskReview(() => { reload().catch(() => {}); }), [reload]);
  return { ...(state.key === key && enabled ? state : { status: 'loading', data: null, error: null }), reload };
}

export function useDashboardRefresh(ref, reloaders) {
  const latest = useRef(reloaders);
  latest.current = reloaders;
  useEffect(() => {
    if (!ref) return undefined;
    const refresh = () => Promise.allSettled(latest.current.map((reload) => reload()));
    ref.current = refresh;
    return () => { if (ref.current === refresh) ref.current = null; };
  }, [ref]);
}
