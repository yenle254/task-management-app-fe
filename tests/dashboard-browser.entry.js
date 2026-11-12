// Verification-only entry: real sign-in, auth provider and HomeScreen, without
// importing the unrelated native-map routes that prevent the full web bundle.
import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/authContext';
import SignInScreen from '../src/screens/auth/signInScreen';
import HomeScreen from '../src/screens/homeScreen';
import apiClient from '../src/services/api';
import socketService from '../src/services/socketService';

// Test-only origin adapter; protected production configuration is unchanged.
apiClient.defaults.baseURL = `${window.location.origin}/api`;
// Realtime messaging is outside this Dashboard HTTP/UI integration check.
socketService.connect = async () => {};
const Stack = createNativeStackNavigator();
function VerificationNavigation() {
  const { isAuthenticated, isLoading, signOut } = useAuth();
  if (isLoading) return <ActivityIndicator />;
  return <View style={{ flex: 1 }}>
    {isAuthenticated && <Pressable accessibilityRole="button" onPress={signOut}><Text>Sign out verification session</Text></Pressable>}
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? <Stack.Screen name="Home" component={HomeScreen} /> : <Stack.Screen name="SignIn" component={SignInScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  </View>;
}
function VerificationApp() {
  return <SafeAreaProvider><AuthProvider><VerificationNavigation /></AuthProvider></SafeAreaProvider>;
}
registerRootComponent(VerificationApp);
