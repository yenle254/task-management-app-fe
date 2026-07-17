import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await authService.getToken();
      const storedUser = await authService.getStoredUser();
      const onboarding = await AsyncStorage.getItem("hasSeenOnboarding");

      setIsAuthenticated(!!token);
      setUser(storedUser);
      setHasSeenOnboarding(onboarding === "true");


      if (token && storedUser) {
        try {
          const response = await authService.getCurrentUser();
          
          // authService.getCurrentUser returns { success, data }
          if (response?.data) {
            setUser(response.data);
          } else {
          }
          
          try {
            await socketService.connect();
            console.log('Socket connected on app start');
          } catch (socketError) {
            console.error('Socket connection failed on app start:', socketError);
          }
        } catch (error) {
          console.log("Could not refresh user data");
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {

      setIsLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await authService.login(email, password);
      setIsAuthenticated(true);
      setUser(response.user);
      
      try {
        await socketService.connect();
        console.log('Socket connected after login');
      } catch (socketError) {
        console.error('Socket connection failed after login:', socketError);
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      return {
        success: false,
        error: error.error || "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData) => {
    try {
      setIsLoading(true);
      
      const response = await authService.register(userData);
      setIsAuthenticated(true);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        error: error.error || "Registration failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Disconnect socket before logout
      socketService.disconnect();
      console.log('Socket disconnected on logout');
      
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      
      // authService.getCurrentUser returns { success, data }
      if (response?.data) {
        setUser(response.data);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  
  const hasRole = (role) => {
    const userRole = user?.role;
    const result = userRole === role;
    return result;
  };

  const canManageTasks = () => {
    const userRole = user?.role;
    const canManage = userRole && ['team_lead', 'hr_manager'].includes(userRole);
    return canManage;
  };

  const isHRManager = () => {
    const result = user?.role === 'hr_manager';
    return result;
  };

  const isTeamLead = () => {
    const result = user?.role === 'team_lead';
    return result;
  };

  const isEmployee = () => {
    const result = user?.role === 'employee';
    return result;
  };

  useEffect(() => {
    if (!isLoading) {
      console.log('🔄 Auth State Updated:', {
        isAuthenticated,
        hasUser: !!user,
        userRole: user?.role,
        userEmail: user?.email,
        userName: user?.profile?.fullName,
        isLoading
      });
    }
  }, [isAuthenticated, user, isLoading]);
  /**
   * Update user profile
   * @param {Object} data - {fullName, department, position, phone, avatar}
   */
  const updateProfile = async (data) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(data);
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.error || "Failed to update profile",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change password
   * @param {string} oldPassword
   * @param {string} newPassword
   */
 const changePassword = async (oldPassword, newPassword) => {
   try {
     const response = await authService.changePassword(
       oldPassword,
       newPassword
     );
     return { success: true, message: response.message };
   } catch (error) {
     return {
       success: false,
       error: error?.error || "Failed to change password",
     };
   }
 };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        hasSeenOnboarding,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshUser,
        completeOnboarding,
        hasRole,
        canManageTasks,
        isHRManager,
        isTeamLead,
        isEmployee,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};