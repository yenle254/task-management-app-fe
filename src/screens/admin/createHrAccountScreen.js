import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import AppButton from "../../components/appButton";
import Colors from "../../styles/color";
import adminService from "../../services/adminService";
import UserIcon from "../../../assets/icons/user.svg";
import EmailIcon from "../../../assets/icons/email.svg";
import PasswordIcon from "../../../assets/icons/password.svg";
import PhoneIcon from "../../../assets/icons/phone.svg";
import CompanyIcon from "../../../assets/icons/company.svg";
import PositionIcon from "../../../assets/icons/keyboard.svg";
import BadgeIcon from "../../../assets/icons/task-square.svg";

const initialState = {
  fullName: "",
  email: "",
  employeeId: "",
  department: "",
  position: "",
  phone: "",
  password: "",
};

const CreateHrAccountScreen = ({ navigation }) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{6,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Invalid phone number format";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        profile: {
          fullName: formData.fullName.trim(),
          employeeId: formData.employeeId.trim(),
        },
      };

      if (formData.department.trim()) {
        payload.profile.department = formData.department.trim();
      }
      if (formData.position.trim()) {
        payload.profile.position = formData.position.trim();
      }
      if (formData.phone.trim()) {
        payload.profile.phone = formData.phone.trim();
      }

      await adminService.createHRAccount(payload);

      Alert.alert(
        "Success",
        "HR Manager account has been created successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              setFormData(initialState);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      const message = error?.error || "Failed to create HR account. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    Icon,
    options = {}
  ) => {
    const isPassword = options.secureTextEntry;
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            errors[field] && styles.inputWrapperError,
          ]}
        >
          <Icon width={20} height={20} style={styles.inputIcon} />
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={formData[field]}
            onChangeText={(text) => handleChange(field, text)}
            placeholder={placeholder}
            placeholderTextColor="#999"
            secureTextEntry={isPassword && !showPassword}
            keyboardType={options.keyboardType || "default"}
            autoCapitalize={options.autoCapitalize || "none"}
            editable={!loading}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          )}
        </View>
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Create HR Account"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.formTitle}>HR Account Information</Text>
            <Text style={styles.formSubtitle}>
              Create a new HR Manager account. The role is fixed to HR Manager.
            </Text>

            <View style={styles.roleBadgeContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Role: HR Manager</Text>
                <Text style={styles.roleBadgeNote}>(Read-only)</Text>
              </View>
            </View>

            {renderInput("Full Name *", "fullName", "Enter full name", UserIcon, {
              autoCapitalize: "words",
            })}

            {renderInput("Email *", "email", "Enter email address", EmailIcon, {
              keyboardType: "email-address",
            })}

            {renderInput("Employee ID *", "employeeId", "Enter employee ID", BadgeIcon)}

            {renderInput("Department", "department", "Enter department", CompanyIcon, {
              autoCapitalize: "words",
            })}

            {renderInput("Position", "position", "Enter position", PositionIcon, {
              autoCapitalize: "words",
            })}

            {renderInput("Phone Number", "phone", "Enter phone number", PhoneIcon, {
              keyboardType: "phone-pad",
            })}

            {renderInput("Initial Password *", "password", "Enter initial password (min 6 chars)", PasswordIcon, {
              secureTextEntry: true,
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text={loading ? "Creating..." : "Create HR Account"}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.loadingOverlay}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default CreateHrAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollViewContent: {
    padding: 16,
  },
  contentWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  content: {
    gap: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  roleBadgeContainer: {
    marginVertical: 8,
  },
  roleBadge: {
    backgroundColor: Colors.frame,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  roleBadgeText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  roleBadgeNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  inputWrapperError: {
    borderColor: "#DC2626",
  },
  inputIcon: {
    marginRight: 12,
    tintColor: Colors.primary,
  },
  textInput: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    padding: 0,
  },
  eyeButton: {
    padding: 4,
  },
  eyeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
  },
  submitButtonContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    alignSelf: "center",
    top: 18,
  },
});
