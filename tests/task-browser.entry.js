// Verification entry: actual Task screens/services/auth with isolated API origin.
// It does not certify native navigation or unrelated whole-app routes.
import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import SignInScreen from '../src/screens/auth/signInScreen';
import TaskScreen from '../src/screens/task/taskScreen';
import TaskDetail from '../src/screens/task/taskDetailScreen';
import CreateTask from '../src/screens/task/createTaskScreen';
import EditTask from '../src/screens/task/editTaskScreen';
import KanbanBoard from '../src/screens/task/kanbanBoardScreen';
import TaskCalendar from '../src/screens/task/taskCalendarScreen';
import TaskTimeline from '../src/screens/task/taskTimelineScreen';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';
import useTaskStore from '../store/taskStore';
const verificationURL = Platform.OS === 'web' ? window.location.origin + '/api' : Constants.expoConfig?.extra?.taskVerificationApiURL;
if (!verificationURL) throw new Error('Isolated verification API origin is required');
apiClient.defaults.baseURL = verificationURL;
socketService.connect = async () => {};
// Expose read-only state evidence to browser tests (not a production entry).
if (Platform.OS === 'web') window.taskVerificationState = () => useTaskStore.getState();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
function Navigation() {
  const { isAuthenticated, isLoading, signOut } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  return <View style={{flex:1, paddingTop: Platform.OS === 'web' ? 0 : Constants.statusBarHeight}}>
    {isAuthenticated && <><Pressable onPress={signOut}><Text>Sign out verification</Text></Pressable><Pressable onPress={() => navigationRef.resetRoot({ index: 0, routes: [{ name: 'Tasks' }] })}><Text>Task list verification</Text></Pressable></>}
    <NavigationContainer ref={navigationRef}><Stack.Navigator screenOptions={{headerShown:false}}>
      {isAuthenticated ? <>
        <Stack.Screen name="Tasks" component={TaskScreen}/>
        <Stack.Screen name="TaskDetail" component={TaskDetail}/>
        <Stack.Screen name="CreateTask" component={CreateTask}/>
        <Stack.Screen name="EditTask" component={EditTask}/>
        <Stack.Screen name="KanbanBoard" component={KanbanBoard}/>
        <Stack.Screen name="TaskCalendar" component={TaskCalendar}/>
        <Stack.Screen name="TaskTimeline" component={TaskTimeline}/>
      </> : <Stack.Screen name="SignIn" component={SignInScreen}/>}
    </Stack.Navigator></NavigationContainer>
  </View>;
}
function VerificationApp() {
  const [ready, setReady] = useState(Platform.OS === 'web');
  useEffect(() => {
    if (Platform.OS !== 'web') AsyncStorage.multiRemove(['authToken', 'user']).then(() => setReady(true));
  }, []);
  if (!ready) return <ActivityIndicator />;
  return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><AuthProvider><Navigation/></AuthProvider></SafeAreaProvider></GestureHandlerRootView>;
}
registerRootComponent(VerificationApp);
