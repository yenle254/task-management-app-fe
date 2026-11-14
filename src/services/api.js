import axios from 'axios';
import API_CONFIG from '../config/runtime-api.config';
import { getValidAccessToken, refreshAccessToken, expireSession, getAuthGeneration } from './tokenManager';
export { subscribeSessionExpired, expireSession } from './tokenManager';
const apiClient = axios.create({ baseURL: API_CONFIG.BASE_URL, timeout: API_CONFIG.TIMEOUT, headers: { 'Content-Type': 'application/json' } });
const publicAuth = url => /^\/auth\/(login|register|forgot-password|verify-otp|reset-password|resend-otp|refresh|logout)$/.test(url || '');
apiClient.interceptors.request.use(async config => {
  config.headers = config.headers || {};
  if (!publicAuth(config.url)) {
    config._authGeneration ??= getAuthGeneration();
    if (config._authGeneration !== getAuthGeneration()) throw new Error('Session changed');
    const token = await getValidAccessToken();
    config._accessToken = token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});
apiClient.interceptors.response.use(response => response.data, async error => {
  const config = error.config;
  if (error.response?.status === 401 && config && !publicAuth(config.url) && config._accessToken && config._authGeneration === getAuthGeneration()) {
    if (!config._retry && process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED !== 'false') {
      config._retry = true;
      await refreshAccessToken(config._accessToken);
      if (config._authGeneration !== getAuthGeneration()) throw { error: 'Session changed' };
      return apiClient(config);
    }
    await expireSession(config._accessToken);
  }
  throw error.response ? { ...error.response.data, status: error.response.status } : { error: error.message || 'Network request failed' };
});
export default apiClient;
