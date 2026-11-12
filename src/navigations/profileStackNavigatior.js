import { useAuth } from '../contexts/authContext';
import AuditLogScreen from '../screens/admin/auditLogScreen';
import AuditLogDetailScreen from '../screens/admin/auditLogDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import ChangePassword from '../screens/profile/changePassword';
import NotificationSettingsScreen from '../screens/profile/notificationSettingsScreen';
import MyProfile from '../screens/profile/myProfile';
import OfficeAssets from '../screens/profile/officeAssets';
import PayrollAndTax from '../screens/profile/payrollAndTax';
import PersonalData from '../screens/profile/personalData';

const Stack = createNativeStackNavigator(); 

const ProfileStackNavigator = () => {
  const { user } = useAuth();
  return (
    <Stack.Navigator initialRouteName="MyProfile">
      {user?.role === 'hr_manager' && (
        <>
          <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuditLogDetail" component={AuditLogDetailScreen} options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyProfile" component={MyProfile} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalData" component={PersonalData} options={{ headerShown: false }} />
      <Stack.Screen name="OfficeAssets" component={OfficeAssets} options={{ headerShown: false }} />
      <Stack.Screen name="PayrollAndTax" component={PayrollAndTax} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;