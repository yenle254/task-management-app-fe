import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { createNavigationContainerRef } from "@react-navigation/native";
import { consumePendingTarget, setTargetHandler } from "../services/pushNotificationService";
import { notificationTarget } from "../utils/notificationTarget";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../contexts/authContext";
import OnboardingScreen from "../screens/auth/onboardingScreen";
import Colors from "../styles/color";
import AuthStack from "./authStack";
import MainStack from "./stackNavigator";
import AdminStackNavigator from "./adminStackNavigator";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const RootNavigator = () => {
  const { isAuthenticated, hasSeenOnboarding, isLoading, user } = useAuth();

  const currentAuth = useRef(null);
  currentAuth.current = { isAuthenticated, userId: user?._id };
  const openPendingTarget = async () => {
    if (!isAuthenticated || !user?._id || !navigationRef.isReady()) return;
    const data = await consumePendingTarget(user._id);
    const target = data && notificationTarget(data, user.role);
    if (target && currentAuth.current.isAuthenticated && currentAuth.current.userId === user._id && navigationRef.isReady()) navigationRef.navigate('MainApp', target);
  };
  useEffect(() => {
    setTargetHandler(() => { openPendingTarget().catch(() => {}); });
    return () => setTargetHandler(null);
  }, [isAuthenticated, user?._id, user?.role]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.button} />
      </View>
    );
  }

  const getInitialStack = () => {
    if (!isAuthenticated) return "AuthStack";
    if (user?.role === "system_admin") return "AdminStack";
    return "MainApp";
  };

  return (
    <NavigationContainer key={getInitialStack()} ref={navigationRef} onReady={() => { openPendingTarget().catch(() => {}); }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        ) : user?.role === "system_admin" ? (
          <Stack.Screen name="AdminStack" component={AdminStackNavigator} />
        ) : (
          <Stack.Screen name="MainApp" component={MainStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
});

export default RootNavigator;
