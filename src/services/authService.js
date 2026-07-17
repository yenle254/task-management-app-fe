import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./api";

const authService = {
  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);

      if (response.token) {
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });

      if (response.token) {
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  /**
   * Request forgot password OTP
   * @param {string} email
   */
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify OTP code
   * @param {string} email
   * @param {string} otp
   */
  verifyOTP: async (email, otp) => {
    try {
      const response = await apiClient.post("/auth/verify-otp", { email, otp });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} email
   * @param {string} resetToken
   * @param {string} newPassword
   */
  resetPassword: async (email, resetToken, newPassword) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
        resetToken,
        newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resend OTP code
   * @param {string} email
   */
  resendOTP: async (email) => {
    try {
      const response = await apiClient.post("/auth/resend-otp", { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user from API
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/auth/me");

      if (response.data) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data));
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get stored user from AsyncStorage
   */
  getStoredUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      return !!token;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get auth token
   */
  getToken: async () => {
    try {
      return await AsyncStorage.getItem("authToken");
    } catch (error) {
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    try {
      const response = await apiClient.put("/auth/profile", data);
      if (response.data) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password
   */
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.put("/auth/password", {
        oldPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
