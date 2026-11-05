// Isolated verification entry, never imported by the production application.
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import ProfileStackNavigator from '../src/navigations/profileStackNavigatior';
import AdminStackNavigator from '../src/navigations/adminStackNavigator';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';
import useAuditStore from '../store/auditStore';

apiClient.defaults.baseURL = window.location.origin + '/api';
socketService.connect = async () => {};
window.auditVerificationState = () => {
  const { records, filters, page, isLoading, error } = useAuditStore.getState();
  return { records, filters, page, isLoading, error };
};
function Navigation() {
  const { isAuthenticated, isLoading, signOut, signIn, user } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  if (!isAuthenticated) return <View><Text>Session ended verification</Text>
    <Pressable accessibilityRole="button" onPress={() => signIn('fixture@example.test', 'fixture-only')}><Text>Sign in fixture</Text></Pressable></View>;
  return <View style={{ flex: 1 }}>
    <Pressable accessibilityRole="button" onPress={signOut}><Text>Sign out verification</Text></Pressable>
    <NavigationContainer>{user?.role === "system_admin" ? <AdminStackNavigator /> : <ProfileStackNavigator />}</NavigationContainer>
  </View>;
}
registerRootComponent(() => <SafeAreaProvider><AuthProvider><Navigation /></AuthProvider></SafeAreaProvider>);
