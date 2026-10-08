import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import OfficeListScreen from "../screens/office/officeListScreen";
import CreateOfficeScreen from "../screens/office/createOfficeScreen";
import EditOfficeScreen from "../screens/office/editOfficeScreen";

const Stack = createNativeStackNavigator();

const OfficeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OfficeList" component={OfficeListScreen} />
      <Stack.Screen name="CreateOffice" component={CreateOfficeScreen} />
      <Stack.Screen name="EditOffice" component={EditOfficeScreen} />
    </Stack.Navigator>
  );
};

export default OfficeStackNavigator;
