import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SecuritySafeIcon from "../../../assets/icons/security_safe.svg";
import AppButton from "../../components/appButton";
import AuthHeader from "../../components/auth/authHeader";
import authService from "../../services/authService";
import AppColors from "../../styles/color";

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value, index) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter complete 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyOTP(email, otpCode);

      if (response.success) {
        navigation.navigate("ResetPassword", {
          email,
          resetToken: response.data.resetToken,
        });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.error || "Invalid verification code. Please try again."
      );
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendLoading) return;

    setResendLoading(true);

    try {
      const response = await authService.resendOTP(email);

      if (response.success) {
        Alert.alert("Success", "New verification code sent to your email");
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.error || "Failed to resend code. Please try again."
      );
    } finally {
      setResendLoading(false);
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
                  title="Verify Code"
                  subtitle={`Enter the 6-digit code sent to ${email}`}
                  showLogo={false}
                />

                <View style={styles.form}>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpInput,
                          digit && styles.otpInputFilled,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <AppButton
                    text={loading ? "Verifying..." : "Verify"}
                    onPress={handleVerify}
                    style={styles.verifyButton}
                    textStyle={styles.verifyButtonText}
                    disabled={loading || otp.join("").length !== 6}
                  />

                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      Didn't receive the code?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={resendTimer > 0 || resendLoading}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          (resendTimer > 0 || resendLoading) &&
                            styles.resendLinkDisabled,
                        ]}
                      >
                        {resendLoading
                          ? "Sending..."
                          : resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : "Resend"}
                      </Text>
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
    height: "25%",
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  otpInputFilled: {
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  verifyButton: {
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
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  loader: {
    marginTop: 20,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  resendText: {
    fontSize: 14,
    color: "#888888",
  },
  resendLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
  },
  resendLinkDisabled: {
    color: "#999999",
  },
});

export default VerifyOTPScreen;
