import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import TaskScreen from "../screens/task/taskScreen";

const Stack = createNativeStackNavigator();

const TaskNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="TaskScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TaskScreen" component={TaskScreen} />
    </Stack.Navigator>
  );
};

export default TaskNavigator;