import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Yup from "yup";
import EmailIcon from "../../../assets/icons/email.svg";
import SecuritySafeIcon from "../../../assets/icons/security_safe.svg";
import AppButton from "../../components/appButton";
import AnimatedBottomSheet from "../../components/auth/animatedBottomSheet";
import AuthHeader from "../../components/auth/authHeader";
import InputField from "../../components/auth/inputField";
import authService from "../../services/authService";
import AppColors from "../../styles/color";

const ForgotPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    const { email } = data;
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());

      if (response.success) {
        Alert.alert(
          "Success",
          response.message || "Verification code sent to your email",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("VerifyOTP", { email: email.trim() }),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.error || "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBottomSheet topSectionHeight="25%">
      <View style={styles.iconContainer}>
        <SecuritySafeIcon width={60} height={60} />
      </View>

      <AuthHeader
        title="Forgot Password"
        subtitle="Enter your email to receive a verification code"
        showLogo={false}
      />

      <View style={styles.form}>
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

        <AppButton
          text={loading ? "Sending..." : "Send Verification Code"}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
          disabled={loading}
        />

        <View style={styles.backToSignInContainer}>
          <Text style={styles.backToSignInText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
            <Text style={styles.backToSignInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedBottomSheet>
  );
};

const styles = StyleSheet.create({
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
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 20,
  },
  backToSignInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  backToSignInText: {
    fontSize: 14,
    color: "#888888",
  },
  backToSignInLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
  },
});

export default ForgotPasswordScreen;
