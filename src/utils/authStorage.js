import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEYS = {
  TOKEN: "authToken",
  USER: "user",
  REFRESH_TOKEN: "refreshToken",
};

/**
 * Save authentication token
 */
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(AUTH_KEYS.TOKEN, token);
    return true;
  } catch (error) {
    console.error("Error saving token:", error);
    return false;
  }
};

/**
 * Get authentication token
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_KEYS.TOKEN);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

/**
 * Remove authentication token
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_KEYS.TOKEN);
    return true;
  } catch (error) {
    console.error("Error removing token:", error);
    return false;
  }
};

/**
 * Save user data
 */
export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
};

/**
 * Get user data
 */
export const getUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(AUTH_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

/**
 * Clear all auth data
 */
export const clearAuth = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_KEYS.TOKEN,
      AUTH_KEYS.USER,
      AUTH_KEYS.REFRESH_TOKEN,
    ]);
    return true;
  } catch (error) {
    console.error("Error clearing auth:", error);
    return false;
  }
};

export default {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  clearAuth,
};
