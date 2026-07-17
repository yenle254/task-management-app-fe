import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import ForgotPasswordScreen from "../screens/auth/forgotPasswordScreen";
import PrivacyPolicyScreen from "../screens/auth/privacyPolicyScreen";
import ResetPasswordScreen from "../screens/auth/resetPasswordScreen";
import SignInScreen from "../screens/auth/signInScreen";
import SignUpScreen from "../screens/auth/signUpScreen";
import TermsConditionsScreen from "../screens/auth/termsConditionsScreen";
import VerifyOTPScreen from "../screens/auth/verifyOTPScreen";

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      <Stack.Screen
        name="TermsConditions"
        component={TermsConditionsScreen}
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
