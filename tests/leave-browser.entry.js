// Selected Leave screens only, with actual service/store/auth and isolated HTTP.
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import LeaveScreen from '../src/screens/leaveScreen';
import SubmitLeaveScreen from '../src/screens/submitLeaveScreen';
import PendingLeavesScreen from '../src/screens/leave/pendingLeavesScreen';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';
import useLeaveStore from '../store/leaveStore';
apiClient.defaults.baseURL = window.location.origin + '/api';
socketService.connect = async () => {};
window.leaveVerificationState = () => useLeaveStore.getState();
const Stack = createNativeStackNavigator(), ref = createNavigationContainerRef();
function Navigation() {
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  if (!isAuthenticated) return <Text>Session expired verification</Text>;
  return <View style={{flex:1}}>
    <Pressable onPress={signOut}><Text>Sign out verification</Text></Pressable>
    <Pressable onPress={() => ref.resetRoot({index:0,routes:[{name:'MyLeaves'}]})}><Text>My leaves verification</Text></Pressable>
    {['team_lead','hr_manager'].includes(user?.role) && <Pressable onPress={() => ref.resetRoot({index:0,routes:[{name:'LeaveInbox'}]})}><Text>Leave inbox verification</Text></Pressable>}
    <NavigationContainer ref={ref}><Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name="MyLeaves" component={LeaveScreen}/>
      <Stack.Screen name="SubmitLeave" component={SubmitLeaveScreen}/>
      <Stack.Screen name="LeaveInbox" component={PendingLeavesScreen}/>
    </Stack.Navigator></NavigationContainer>
  </View>;
}
registerRootComponent(() => <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><AuthProvider><Navigation/></AuthProvider></SafeAreaProvider></GestureHandlerRootView>);
