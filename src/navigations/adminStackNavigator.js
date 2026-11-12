import AuditLogScreen from '../screens/admin/auditLogScreen';
import AuditLogDetailScreen from '../screens/admin/auditLogDetailScreen';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AdminDashboardScreen from "../screens/admin/adminDashboardScreen";
import CreateHrAccountScreen from "../screens/admin/createHrAccountScreen";

const Stack = createNativeStackNavigator();

const AdminStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AuditLog" component={AuditLogScreen} />
      <Stack.Screen name="AuditLogDetail" component={AuditLogDetailScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CreateHrAccount" component={CreateHrAccountScreen} />
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
