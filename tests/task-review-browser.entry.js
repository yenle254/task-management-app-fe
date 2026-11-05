// Isolated UI acceptance entry; production services, stores and screens.
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Text } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import ApprovalsScreen from '../src/screens/task/approvalsScreen';
import TaskDetailScreen from '../src/screens/task/taskDetailScreen';
import NotificationSettingsScreen from '../src/screens/profile/notificationSettingsScreen';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';
import useTaskStore from '../store/taskStore';
apiClient.defaults.baseURL = window.location.origin + '/api';
socketService.connect = async () => {};
const Stack = createNativeStackNavigator(), ref = createNavigationContainerRef();
window.reviewTest = { state: () => useTaskStore.getState(), open: (name, params) => ref.navigate(name, params) };
function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  if (!isAuthenticated) return <Text>Signed out</Text>;
  return <NavigationContainer ref={ref}><Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Approvals" component={ApprovalsScreen} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
    <Stack.Screen name="Settings" component={NotificationSettingsScreen} />
  </Stack.Navigator></NavigationContainer>;
}
registerRootComponent(() => <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><AuthProvider><Navigation /></AuthProvider></SafeAreaProvider></GestureHandlerRootView>);
