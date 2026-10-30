import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AdminDashboardScreen from "../screens/admin/adminDashboardScreen";
import CreateHrAccountScreen from "../screens/admin/createHrAccountScreen";

const Stack = createNativeStackNavigator();

const AdminStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CreateHrAccount" component={CreateHrAccountScreen} />
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
