import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ChangePassword from '../screens/profile/changePassword';
import MyProfile from '../screens/profile/myProfile';
import OfficeAssets from '../screens/profile/officeAssets';
import PayrollAndTax from '../screens/profile/payrollAndTax';
import PersonalData from '../screens/profile/personalData';

const Stack = createNativeStackNavigator(); 

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="MyProfile">
      <Stack.Screen name="MyProfile" component={MyProfile} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalData" component={PersonalData} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeAssets" component={OfficeAssets} options={{ headerShown: false }} />
      <Stack.Screen name="PayrollAndTax" component={PayrollAndTax} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;