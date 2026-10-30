import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../contexts/authContext";
import OnboardingScreen from "../screens/auth/onboardingScreen";
import Colors from "../styles/color";
import AuthStack from "./authStack";
import MainStack from "./stackNavigator";
import AdminStackNavigator from "./adminStackNavigator";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, hasSeenOnboarding, isLoading, user } = useAuth();

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
    <NavigationContainer key={getInitialStack()}>
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
