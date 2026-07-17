import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/appButton";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import { useAuth } from "../../contexts/authContext";
import authService from "../../services/authService";
import Colors from "../../styles/color";
import ChevronDown from "../../../assets/icons/chevron_down.svg";
import BuildingIcon from "../../../assets/icons/company.svg";
import EmailIcon from "../../../assets/icons/email.svg";
import PositionIcon from "../../../assets/icons/keyboard.svg";
import CallIcon from "../../../assets/icons/phone.svg";
import UploadIcon from "../../../assets/icons/upload.svg";
import {
  default as BadgeIcon,
  default as UserIcon,
} from "../../../assets/icons/user.svg";

import DefaultProfileImage from "../../../assets/images/icon.png";

const PersonalData = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    department: "",
    position: "",
    employeeId: "",
    avatar: null,
    email: "",
  });

  const [originalData, setOriginalData] = useState({});

  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectModalData, setSelectModalData] = useState({
    field: "",
    title: "",
    items: [],
    tempValue: null,
  });

  const departments = [
    "Software Development",
    "Human Resources",
    "Quality Assurance",
    "Design",
    "Marketing",
    "Finance",
    "Operations",
  ];

  const positions = [
    "Junior Full Stack Developer",
    "Senior Frontend Engineer",
    "Backend Developer",
    "Mobile Developer",
    "UI/UX Designer",
    "Project Manager",
    "Team Lead",
    "HR Manager",
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const response = await authService.getCurrentUser();

      if (response.success && response.data) {
        const userData = response.data;
        const profileData = {
          fullName: userData.profile?.fullName || "",
          phone: userData.profile?.phone || "",
          department: userData.profile?.department || "",
          position: userData.profile?.position || "",
          employeeId: userData.profile?.employeeId || "",
          avatar: userData.profile?.avatar || null,
          email: userData.email || "",
        };

        setFormData(profileData);
        setOriginalData(profileData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      if (user) {
        const profileData = {
          fullName: user.profile?.fullName || "",
          phone: user.profile?.phone || "",
          department: user.profile?.department || "",
          position: user.profile?.position || "",
          employeeId: user.profile?.employeeId || "",
          avatar: user.profile?.avatar || null,
          email: user.email || "",
        };
        setFormData(profileData);
        setOriginalData(profileData);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.fullName !== originalData.fullName ||
      formData.phone !== originalData.phone ||
      formData.department !== originalData.department ||
      formData.position !== originalData.position ||
      formData.avatar !== originalData.avatar
    );
  };

  const openSelectModal = (field, items, title) => {
    const currentValue = formData[field];
    setSelectModalData({
      field,
      title,
      items,
      tempValue: currentValue,
    });
    setShowSelectModal(true);
  };

  const confirmSelect = () => {
    if (selectModalData.tempValue !== null) {
      setFormData((prev) => ({
        ...prev,
        [selectModalData.field]: selectModalData.tempValue,
      }));
      setShowSelectModal(false);
    }
  };

  const handleAvatarPick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);

        const imageUri = result.assets[0].uri;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        const formDataUpload = new FormData();
        formDataUpload.append("file", {
          uri: imageUri,
          name: filename,
          type,
        });

        // const uploadResponse = await uploadService.uploadImage(formDataUpload);
        // setFormData(prev => ({ ...prev, avatar: uploadResponse.url }));

        setFormData((prev) => ({ ...prev, avatar: imageUri }));
        setUploadingAvatar(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setUploadingAvatar(false);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Validation Error", "Full name is required.");
      return;
    }

    if (formData.fullName.trim().length < 3) {
      Alert.alert(
        "Validation Error",
        "Full name must be at least 3 characters."
      );
      return;
    }

    if (!hasChanges()) {
      Alert.alert("No Changes", "No changes detected to update.");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || null,
        department: formData.department || null,
        position: formData.position || null,
        avatar: formData.avatar || null,
      };

      const response = await authService.updateProfile(updateData);

      if (response.success) {
        await refreshUser();

        setOriginalData({ ...formData });

        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.error || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = (
    label,
    value,
    onChange,
    placeholder,
    Icon,
    options = {}
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          options.disabled && styles.inputContainerDisabled,
        ]}
      >
        <Icon width={20} height={20} style={styles.icon} />
        <TextInput
          style={[styles.input, options.disabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          editable={!options.disabled}
          keyboardType={options.keyboardType || "default"}
        />
      </View>
    </View>
  );

  const renderSelector = (label, value, placeholder, onPress, Icon) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onPress}>
        <View style={styles.selectorLeft}>
          <Icon width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </TouchableOpacity>
    </View>
  );

  const renderBottomModal = () => (
    <Modal
      visible={showSelectModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSelectModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowSelectModal(false)}
      >
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectModalData.title}</Text>
            <View style={styles.modalDivider} />
          </View>
          <FlatList
            data={selectModalData.items}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectModalData.tempValue === item &&
                    styles.modalItemSelected,
                ]}
                onPress={() =>
                  setSelectModalData((prev) => ({ ...prev, tempValue: item }))
                }
              >
                <Text
                  style={[
                    styles.itemName,
                    selectModalData.tempValue === item &&
                      styles.itemNameSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 300 }}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={() => setShowSelectModal(false)}
            >
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !selectModalData.tempValue && styles.modalButtonDisabled,
              ]}
              onPress={confirmSelect}
              disabled={!selectModalData.tempValue}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Personal Data"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Personal Data"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.photoContainer}>
              {uploadingAvatar ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : (
                <Image
                  source={
                    formData.avatar
                      ? { uri: formData.avatar }
                      : DefaultProfileImage
                  }
                  style={styles.profileImage}
                />
              )}
              <Pressable style={styles.uploadButton} onPress={handleAvatarPick}>
                <UploadIcon width={20} height={20} fill={Colors.primary} />
              </Pressable>
              <Text style={styles.photoText}>Upload Photo</Text>
              <Text style={styles.photoSubtitle}>
                Format should be in .jpg, .png and less than 5MB
              </Text>
            </View>

            {renderInputField(
              "Employee ID",
              formData.employeeId,
              () => {},
              "Employee ID",
              BadgeIcon,
              { disabled: true }
            )}

            {renderInputField(
              "Email",
              formData.email,
              () => {},
              "Email",
              EmailIcon,
              { disabled: true }
            )}

            {renderInputField(
              "Full Name",
              formData.fullName,
              (text) => setFormData((prev) => ({ ...prev, fullName: text })),
              "Enter full name",
              UserIcon
            )}

            {renderInputField(
              "Phone Number",
              formData.phone,
              (text) => setFormData((prev) => ({ ...prev, phone: text })),
              "Enter phone number",
              CallIcon,
              { keyboardType: "phone-pad" }
            )}

            {renderSelector(
              "Department",
              formData.department,
              "Select department",
              () =>
                openSelectModal("department", departments, "Select Department"),
              BuildingIcon
            )}

            {renderSelector(
              "Position",
              formData.position,
              "Select position",
              () => openSelectModal("position", positions, "Select Position"),
              PositionIcon
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text={saving ? "Updating..." : "Update Profile"}
          onPress={handleSubmit}
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          textStyle={styles.submitButtonText}
          disabled={saving}
        />
      </View>

      {renderBottomModal()}
    </SafeAreaView>
  );
};

export default PersonalData;

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
    gap: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#475467",
    textAlign: "center",
    marginBottom: 24,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  // Photo
  photoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: "#E8E8E8",
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    position: "absolute",
    bottom: 50,
    right: "35%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },

  // Form Fields
  selectorContainer: {
    gap: 8,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  inputContainerDisabled: {
    backgroundColor: "#F5F5F5",
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  inputDisabled: {
    color: "#888",
  },
  selector: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectorText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
    flex: 1,
  },
  placeholderText: {
    color: "#999999",
    fontWeight: "400",
  },

  // Submit Button
  submitButtonContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    height: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: Colors.primary + "15",
  },
  itemName: {
    fontSize: 16,
    color: "#333",
  },
  itemNameSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonClose: {
    backgroundColor: "#F5F5F5",
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextClose: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
