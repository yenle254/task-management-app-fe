import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import TeamScreen from "../screens/teamScreen";
import TeamDetailsScreen from "../screens/team/teamDetailsScreen";
import CreateTeamScreen from "../screens/team/createTeamScreen";
import AddMemberScreen from "../screens/team/addMemberScreen";
import EditTeamScreen from "../screens/team/editTeamScreen";
import OfficeListScreen from "../screens/office/officeListScreen";
import CreateOfficeScreen from "../screens/office/createOfficeScreen";
import EditOfficeScreen from "../screens/office/editOfficeScreen";

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
      <Stack.Screen name="OfficeList" component={OfficeListScreen} />
      <Stack.Screen name="CreateOffice" component={CreateOfficeScreen} />
      <Stack.Screen name="EditOffice" component={EditOfficeScreen} />
    </Stack.Navigator>
  );
};

export default TeamStackNavigator;
