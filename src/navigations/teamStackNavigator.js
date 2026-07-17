import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import TeamScreen from "../screens/teamScreen";
import TeamDetailsScreen from "../screens/team/teamDetailsScreen";
import CreateTeamScreen from "../screens/team/createTeamScreen";
import AddMemberScreen from "../screens/team/addMemberScreen";
import EditTeamScreen from "../screens/team/editTeamScreen";

const Stack = createNativeStackNavigator();

const TeamStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="TeamList"
      screenOptions={{
        headerShown: false, 
      }}
    >
      <Stack.Screen name="TeamList" component={TeamScreen} />
      <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
      <Stack.Screen name="EditTeam" component={EditTeamScreen} />
      <Stack.Screen name="AddMember" component={AddMemberScreen} />
    </Stack.Navigator>
  );
};

export default TeamStackNavigator;
