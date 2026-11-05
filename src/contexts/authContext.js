import useAuditStore from '../../store/auditStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLeaveStore from '../../store/leaveStore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import { subscribeSessionExpired } from '../services/api';
import socketService from '../services/socketService';
import useTaskStore from '../../store/taskStore';
import useMessageStore from '../../store/messageStore';

import useNotificationStore from '../../store/notificationStore';
import useNotificationPreferencesStore from '../../store/notificationPreferencesStore';
import { initNotificationManager, stopNotificationManager, cleanupNotifications, showForegroundNotification } from '../services/pushNotificationService';

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
    const unsubscribe = subscribeSessionExpired(() => {
      useMessageStore.getState().reset();
      useAuditStore.getState().reset();
      cleanupNotifications(false).catch(() => {});
      useNotificationStore.getState().reset();
      useNotificationPreferencesStore.getState().reset();
      useTaskStore.getState().reset();
      useLeaveStore.getState().reset();
      socketService.disconnect();
      setIsAuthenticated(false);
      setUser(null);
    });
    checkAuthState();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    const store = useNotificationStore.getState();
    const preferenceStore = useNotificationPreferencesStore.getState();
    preferenceStore.fetchPreferences().catch(() => {});
    initNotificationManager(user._id, notification => {
      if (useNotificationStore.getState().handleRealtimeNotification(notification)) {
        showForegroundNotification(notification, useNotificationPreferencesStore.getState().preferences).catch(() => {});
      }
    }, () => useNotificationPreferencesStore.getState().preferences);
    store.startAutoRefresh();
    return () => { stopNotificationManager(); useNotificationStore.getState().stopAutoRefresh(); };
  }, [isAuthenticated, user?._id]);

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
      useMessageStore.getState().reset();
      useAuditStore.getState().reset();
      useTaskStore.getState().reset();
      useLeaveStore.getState().reset();
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
      useMessageStore.getState().reset();
      useAuditStore.getState().reset();
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
      // Unregister while the session token is still valid.
      await cleanupNotifications();
      useNotificationStore.getState().reset();
      useNotificationPreferencesStore.getState().reset();
      // Disconnect socket before logout
      useMessageStore.getState().reset();
      useAuditStore.getState().reset();
      socketService.disconnect();
      console.log('Socket disconnected on logout');
      
      await authService.logout();
      useTaskStore.getState().reset();
      useLeaveStore.getState().reset();
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

  const isSystemAdmin = () => {
    const result = user?.role === 'system_admin';
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
        isSystemAdmin,
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
