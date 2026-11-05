// Selected notification UI only. Real services/stores; isolated HTTP fixture.
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import NotificationSettingsScreen from '../src/screens/profile/notificationSettingsScreen';
import NotificationScreen from '../src/screens/notificationScreen';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';
import useNotificationStore from '../store/notificationStore';
import useNotificationPreferencesStore from '../store/notificationPreferencesStore';
apiClient.defaults.baseURL = window.location.origin + '/api';
socketService.connect = async () => {};
window.notificationVerificationState = () => ({ preferences: useNotificationPreferencesStore.getState().preferences, notifications: useNotificationStore.getState().notifications });
const Stack = createNativeStackNavigator(), ref = createNavigationContainerRef();
function Navigation() {
 const { isAuthenticated, isLoading, signOut } = useAuth();
 if (isLoading) return <ActivityIndicator />;
 if (!isAuthenticated) return <Text>Session expired verification</Text>;
 return <View style={{flex:1}}>
  <Pressable accessibilityRole="button" onPress={signOut}><Text>Sign out verification</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={() => ref.resetRoot({index:0,routes:[{name:'Settings'}]})}><Text>Settings verification</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={() => ref.resetRoot({index:0,routes:[{name:'Notification'}]})}><Text>Inbox verification</Text></Pressable>
  <NavigationContainer ref={ref}><Stack.Navigator screenOptions={{headerShown:false}}>
   <Stack.Screen name="Settings" component={NotificationSettingsScreen} />
   <Stack.Screen name="Notification" component={NotificationScreen} />
  </Stack.Navigator></NavigationContainer>
 </View>;
}
registerRootComponent(() => <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><AuthProvider><Navigation/></AuthProvider></SafeAreaProvider></GestureHandlerRootView>);
