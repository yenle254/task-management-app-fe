import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Yup from "yup";
import EmailIcon from "../../../assets/icons/email.svg";
import EyeOffIcon from "../../../assets/icons/eye-off.svg";
import EyeIcon from "../../../assets/icons/eye.svg";
import PasswordIcon from "../../../assets/icons/password.svg";
import AppButton from "../../components/appButton";
import AnimatedBottomSheet from "../../components/auth/animatedBottomSheet";
import AuthHeader from "../../components/auth/authHeader";
import InputField from "../../components/auth/inputField";
import LoadingSpinner from "../../components/loadingSpinner";
import { useAuth } from "../../contexts/authContext";
import AppColors from "../../styles/color";

const SignInScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    const { email, password } = data;
    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password.trim());
      if (!result.success) {
        Alert.alert("Login Failed", result.error || "Failed to sign in.");
        return;
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const Checkbox = ({ value, onValueChange }) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <View style={styles.checkboxInner} />}
      </View>
      <Text style={styles.checkboxLabel}>Remember Me</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Signing in..." />
      </View>
    );
  }

  return (
    <AnimatedBottomSheet topSectionHeight="15%">
      <AuthHeader
        title="Sign In"
        subtitle="Welcome back! Please sign in to your account."
        showLogo={false}
      />

      <View style={styles.form}>
        <InputField
          name="email"
          icon={EmailIcon}
          label="Email"
          placeholder="My Email"
          control={control}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.inputContainer}
        />

        <InputField
          name="password"
          icon={PasswordIcon}
          label="Password"
          placeholder="My Password"
          control={control}
          error={errors.password}
          secureTextEntry={!showPassword}
          showToggle={true}
          onTogglePress={() => setShowPassword(!showPassword)}
          rightIcon={showPassword ? EyeIcon : EyeOffIcon}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.rowSpaceBetween}>
          <Checkbox value={rememberMe} onValueChange={setRememberMe} />
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password</Text>
          </TouchableOpacity>
        </View>

        <AppButton
          text="Sign In"
          onPress={handleSubmit(onSubmit)}
          style={styles.signInButton}
          textStyle={styles.signInButtonText}
          disabled={isLoading}
        />

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>Sign in With Employee ID</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.outlineButton, { marginTop: 12 }]}>
          <Text style={styles.outlineButtonText}>Sign in With Phone</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signUpLink}>Sign Up Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedBottomSheet>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: AppColors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  forgotPasswordText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  signInButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: "#fff",
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primary,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  signUpText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  signUpLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
  },
});

export default SignInScreen;
