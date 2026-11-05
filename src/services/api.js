import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api.config';

const sessionExpiredListeners = new Set();
export const subscribeSessionExpired = (listener) => {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Don't override Content-Type for FormData (multipart uploads)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    console.log('API Error Details:', {
      response: error.response?.status,
      request: !!error.request,
      message: error.message,
      url: error.config?.url,
    });
    
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        const currentToken = await AsyncStorage.getItem('authToken');
        // A delayed failure from an earlier account must not clear a new session.
        if (currentToken && error.config?.headers?.Authorization === `Bearer ${currentToken}`) {
          await Promise.all([AsyncStorage.removeItem('authToken'), AsyncStorage.removeItem('user')]);
          sessionExpiredListeners.forEach((listener) => listener());
        }
      }
      
      return Promise.reject(data && typeof data === 'object' ? { ...data, status } : { error: data || error.message, status });
    } else if (error.request) {
      console.error('Network request error:', error.request);
      return Promise.reject({ error: `Network error: Cannot connect to ${API_CONFIG.BASE_URL}. Check if server is running.` });
    } else {
      return Promise.reject({ error: error.message });
    }
  }
);

export default apiClient;

