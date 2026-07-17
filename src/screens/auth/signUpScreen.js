import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";

import CompanyIcon from "../../../assets/icons/company.svg";
import EmailIcon from "../../../assets/icons/email.svg";
import EyeOffIcon from "../../../assets/icons/eye-off.svg";
import EyeIcon from "../../../assets/icons/eye.svg";
import PasswordIcon from "../../../assets/icons/password.svg";
import UserIcon from "../../../assets/icons/user.svg";

import AppButton from "../../components/appButton";
import AuthHeader from "../../components/auth/authHeader";
import CheckboxField from "../../components/auth/checkboxField";
import InputField from "../../components/auth/inputField";
import LoadingSpinner from "../../components/loadingSpinner";
import { useAuth } from "../../contexts/authContext";
import AppColors from "../../styles/color";

const SignUpScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required("Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: Yup.string().email("Email is invalid").required("Email is required"),
    employeeId: Yup.string().required("Employee ID is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords do not match")
      .required("Confirm Password is required"),
    agreeTerms: Yup.boolean()
      .oneOf([true], "You must accept the terms and conditions")
      .required("You must accept the terms and conditions"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      employeeId: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
  });

  const onSubmit = async (data) => {
    const { email, employeeId, password, fullName } = data;

    setIsLoading(true);
    try {
      const userData = {
        email: email.trim(),
        password: password.trim(),
        profile: {
          fullName: fullName.trim(),
          employeeId: employeeId.trim(),
        },
      };

      const result = await signUp(userData);

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to sign up.");
        return;
      }

      Alert.alert("Success", "Registration successful!");
    } catch (error) {
      Alert.alert("Error", error.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    if (errors.fullName) setFocus("fullName");
    else if (errors.email) setFocus("email");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Creating your account..." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.topSection} />

        <View style={styles.bottomSheet}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <AuthHeader
                  title="Sign Up"
                  subtitle="Register Using Your Credentials"
                  showLogo={false}
                />

                <View style={styles.form}>
                  <InputField
                    name="fullName"
                    icon={UserIcon || CompanyIcon}
                    label="Full Name"
                    placeholder="Enter your full name"
                    control={control}
                    error={errors.fullName}
                    autoCapitalize="words"
                    containerStyle={styles.inputContainer}
                  />

                  <InputField
                    name="email"
                    icon={EmailIcon}
                    label="Email"
                    placeholder="Enter your email"
                    control={control}
                    error={errors.email}
                    keyboardType="email-address"
                    containerStyle={styles.inputContainer}
                  />

                  <InputField
                    name="employeeId"
                    icon={CompanyIcon}
                    label="Employee ID"
                    placeholder="Enter your employee ID"
                    control={control}
                    error={errors.employeeId}
                    containerStyle={styles.inputContainer}
                  />

                  <InputField
                    name="password"
                    icon={PasswordIcon}
                    label="Password"
                    placeholder="••••••••"
                    control={control}
                    error={errors.password}
                    secureTextEntry={!showPassword}
                    showToggle={true}
                    onTogglePress={() => setShowPassword(!showPassword)}
                    rightIcon={showPassword ? EyeIcon : EyeOffIcon}
                    containerStyle={styles.inputContainer}
                  />

                  <InputField
                    name="confirmPassword"
                    icon={PasswordIcon}
                    label="Confirm Password"
                    placeholder="••••••••"
                    control={control}
                    error={errors.confirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    showToggle={true}
                    onTogglePress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    rightIcon={showConfirmPassword ? EyeIcon : EyeOffIcon}
                    containerStyle={styles.inputContainer}
                  />

                  <CheckboxField
                    name="agreeTerms"
                    control={control}
                    error={errors.agreeTerms}
                  >
                    <Text style={styles.checkboxText}>
                      I agree with{" "}
                      <Text
                        style={styles.linkText}
                        onPress={() => navigation.navigate("TermsConditions")}
                      >
                        terms & conditions
                      </Text>
                      {" and "}
                      <Text
                        style={styles.linkText}
                        onPress={() => navigation.navigate("PrivacyPolicy")}
                      >
                        privacy policy
                      </Text>
                    </Text>
                  </CheckboxField>

                  <AppButton
                    text="Sign Up"
                    onPress={handleSubmit(onSubmit, onInvalid)}
                    style={styles.signUpButton}
                    textStyle={styles.signUpButtonText}
                  />

                  <View style={styles.signInContainer}>
                    <Text style={styles.signInText}>
                      Already have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("SignIn")}
                    >
                      <Text style={styles.signInLink}>Sign in here</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E1E2E",
  },
  container: {
    flex: 1,
    backgroundColor: "#1E1E2E",
  },
  topSection: {
    height: "10%",
    backgroundColor: "#1E1E2E",
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    marginTop: -20,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  checkboxText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  signUpButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    marginTop: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signInText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  signInLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
  },
});

export default SignUpScreen;
