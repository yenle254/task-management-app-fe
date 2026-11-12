import apiClient from './api';
import { getToken, getUser, saveUser, withAuthLock } from '../utils/authStorage';
import { setSession, logoutSession, getAuthGeneration, trackPasswordChange } from './tokenManager';
const authenticate = async (path, data) => {
  const generation = getAuthGeneration();
  const response = await apiClient.post(path, data);
  if (response.token) await setSession(response, generation);
  return response;
};
const authService = {
  register: data => authenticate('/auth/register', data),
  login: (email, password) => authenticate('/auth/login', { email, password }),
  logout: logoutSession,
  logoutAll: async () => { try { return await apiClient.post('/auth/logout-all'); } finally { await logoutSession(); } },
  listSessions: () => apiClient.get('/auth/sessions'),
  revokeSession: id => apiClient.delete(`/auth/sessions/${id}`),
  forgotPassword: email => apiClient.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, resetToken, newPassword) => apiClient.post('/auth/reset-password', { email, resetToken, newPassword }),
  resendOTP: email => apiClient.post('/auth/resend-otp', { email }),
  getCurrentUser: async () => {
    const generation = getAuthGeneration();
    const response = await apiClient.get('/auth/me');
    await withAuthLock(async () => {
      if (generation !== getAuthGeneration()) throw new Error('Session changed');
      if (response.data) await saveUser(response.data);
    });
    return response;
  },
  getStoredUser: getUser,
  getToken,
  isAuthenticated: async () => { try { return Boolean((await apiClient.get('/auth/me')).data); } catch { return false; } },
  updateProfile: async data => {
    const generation = getAuthGeneration();
    const response = await apiClient.put('/auth/profile', data);
    await withAuthLock(async () => {
      if (generation !== getAuthGeneration()) throw new Error('Session changed');
      if (response.data) await saveUser(response.data);
    });
    return response;
  },
  changePassword: (oldPassword, newPassword) => trackPasswordChange(async () => {
    const generation = getAuthGeneration();
    const response = await apiClient.put('/auth/password', { oldPassword, newPassword });
    if (response.token) await setSession(response, generation);
    return response;
  }),
};
export default authService;
