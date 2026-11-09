import axios from 'axios';
import API_CONFIG from '../config/api.config';
import { getCredentials, saveCredentials, clearAuth, saveUser, withAuthLock } from '../utils/authStorage';
const transport = axios.create({ baseURL: API_CONFIG.BASE_URL, timeout: API_CONFIG.TIMEOUT });
const listeners = new Set();
const changedListeners = new Set();
let generation = 0;
let pending = null;
let passwordChange = null;
let logoutGeneration = null;
export const subscribeSessionExpired = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const subscribeTokenChanged = listener => { changedListeners.add(listener); return () => changedListeners.delete(listener); };
export const getAuthGeneration = () => generation;
export const isPasswordChanging = () => Boolean(passwordChange);
export const waitForPasswordChange = () => passwordChange;
export const trackPasswordChange = operation => {
  passwordChange = operation().finally(() => { passwordChange = null; });
  return passwordChange;
};
export const setSession = (pair, expectedGeneration = generation) => withAuthLock(async () => {
  if (generation !== expectedGeneration) throw new Error('Session changed');
  generation += 1;
  await saveCredentials(pair);
  if (pair.user) await saveUser(pair.user);
  changedListeners.forEach(listener => listener(pair.token));
});
export const expireSession = expectedToken => withAuthLock(async () => {
  const current = await getCredentials();
  if (!current || current.token !== expectedToken) return false;
  generation += 1;
  await clearAuth();
  listeners.forEach(listener => listener());
  return true;
});
export const clearSession = () => withAuthLock(async () => { generation += 1; await clearAuth(); });
const expiredSoon = token => {
  try { const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return payload.exp * 1000 <= Date.now() + 60000; }
  catch { return false; }
};
const failure = error => ({ ...(error.response?.data || {}), status: error.response?.status, error: error.response?.data?.error || 'Unable to refresh session' });
export const refreshAccessToken = async expectedToken => {
  if (process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED === 'false') throw { status: 503, error: 'Automatic refresh is disabled' };
  if (logoutGeneration === generation) throw { error: 'Logout in progress' };
  const before = await getCredentials();
  if (!before) throw { status: 401, error: 'Please sign in again' };
  if (expectedToken && before.token !== expectedToken) return before.token;
  if (pending) return pending;
  const started = generation;
  pending = (async () => {
    if (!before.refreshToken) { await expireSession(before.token); throw { status: 401, error: 'Please sign in again' }; }
    try {
      const { data } = await transport.post('/auth/refresh', { refreshToken: before.refreshToken });
      if (!data.token || !data.refreshToken) throw new Error('Invalid refresh response');
      await withAuthLock(async () => {
        const current = await getCredentials();
        if (generation !== started || current?.refreshToken !== before.refreshToken) throw new Error('Session changed');
        await saveCredentials(data);
      });
      changedListeners.forEach(listener => listener(data.token));
      return data.token;
    } catch (error) {
      if (error.response?.status === 409) {
        // Another web tab may have won rotation. A grace conflict never clears credentials.
        for (let attempt = 0; attempt < 10; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const latest = await getCredentials();
          if (generation !== started) throw new Error('Session changed');
          if (latest?.token && latest.refreshToken !== before.refreshToken) return latest.token;
        }
      }
      if (error.response?.status === 401 && generation === started) await expireSession(before.token);
      throw failure(error);
    }
  })().finally(() => { pending = null; });
  return pending;
};
export const getValidAccessToken = async () => {
  if (logoutGeneration === generation) return null;
  const pair = await getCredentials();
  if (!pair) return null;
  if (process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED !== 'false' && pair.refreshToken && expiredSoon(pair.token)) return refreshAccessToken(pair.token);
  return pair.token;
};
export const authorizedFetch = async (url, options = {}) => {
  if (new URL(url, API_CONFIG.BASE_URL).origin !== new URL(API_CONFIG.BASE_URL).origin) return fetch(url, options);
  const token = await getValidAccessToken();
  const started = generation;
  const send = value => fetch(url, { ...options, headers: { ...options.headers, ...(value ? { Authorization: `Bearer ${value}` } : {}) } });
  let result = await send(token);
  if (result.status === 401 && token && started === generation && process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED !== 'false') {
    const next = await refreshAccessToken(token);
    if (started !== generation) throw new Error('Session changed');
    result = await send(next);
    if (result.status === 401) await expireSession(next);
  }
  return result;
};
export const logoutSession = async () => {
  const snapshot = await withAuthLock(async () => {
    const pair = await getCredentials();
    generation += 1;
    logoutGeneration = generation; // Invalidate pending refresh before sending logout.
    return { pair, generation };
  });
  try {
    if (snapshot.pair) await transport.post('/auth/logout', { refreshToken: snapshot.pair.refreshToken },
      { headers: { Authorization: `Bearer ${snapshot.pair.token}` } });
  } finally {
    await withAuthLock(async () => {
      if (generation === snapshot.generation) await clearAuth();
      if (logoutGeneration === snapshot.generation) logoutGeneration = null;
    });
  }
};
