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
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";
import EyeOffIcon from "../../../assets/icons/eye-off.svg";
import EyeIcon from "../../../assets/icons/eye.svg";
import PasswordIcon from "../../../assets/icons/password.svg";
import SecuritySafeIcon from "../../../assets/icons/security_safe.svg";
import AppButton from "../../components/appButton";
import AuthHeader from "../../components/auth/authHeader";
import InputField from "../../components/auth/inputField";
import authService from "../../services/authService";
import AppColors from "../../styles/color";

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, resetToken } = route.params;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords do not match")
      .required("Confirm Password is required"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    const { password } = data;
    setLoading(true);

    try {
      const response = await authService.resetPassword(
        email,
        resetToken,
        password
      );

      if (response.success) {
        Alert.alert(
          "Success",
          response.message || "Your password has been reset successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "SignIn" }],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.error || "Failed to reset password. Please try again."
      );

      if (
        error.error?.includes("expired") ||
        error.error?.includes("Invalid")
      ) {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "ForgotPassword" }],
          });
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

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
                <View style={styles.iconContainer}>
                  <SecuritySafeIcon width={60} height={60} />
                </View>

                <AuthHeader
                  title="Reset Password"
                  subtitle="Create your new password"
                  showLogo={false}
                />

                <View style={styles.form}>
                  <InputField
                    name="password"
                    icon={PasswordIcon}
                    label="New Password"
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
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

                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      Password must contain:
                    </Text>
                    <Text style={styles.requirementItem}>
                      • At least 6 characters
                    </Text>
                    <Text style={styles.requirementItem}>
                      • Both uppercase and lowercase letters (recommended)
                    </Text>
                    <Text style={styles.requirementItem}>
                      • At least one number (recommended)
                    </Text>
                  </View>

                  <AppButton
                    text={loading ? "Resetting..." : "Reset Password"}
                    onPress={handleSubmit(onSubmit)}
                    style={styles.resetButton}
                    textStyle={styles.resetButtonText}
                    disabled={loading}
                  />
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
    height: "15%",
    backgroundColor: "#1E1E2E",
    paddingHorizontal: 20,
    justifyContent: "flex-end",
    paddingBottom: 30,
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  form: {
    flex: 1,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordRequirements: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  resetButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    marginTop: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 20,
  },
});

export default ResetPasswordScreen;
