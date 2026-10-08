import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import AppButton from "../../components/appButton";
import Colors from "../../styles/color";
import LabeledTextInput from "../../components/profile/labeledTextInput";
import officeService from "../../services/officeService";
import LocationIcon from "../../../assets/icons/location-tick.svg";
import ClockIcon from "../../../assets/icons/clock.svg";
import RadiusIcon from "../../../assets/icons/arrow-right.svg";
import ChevronDown from "../../../assets/icons/chevron_down.svg";

const radiusOptions = [50, 100, 150, 200, 300, 500];

const CreateOfficeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 200,
    workStartTime: "09:00",
    workEndTime: "18:00",
    isActive: true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Office name is required");
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert("Validation Error", "Please enter a valid latitude (-90 to 90)");
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert("Validation Error", "Please enter a valid longitude (-180 to 180)");
      return;
    }

    if (formData.latitude.trim() === "" || formData.longitude.trim() === "") {
      Alert.alert("Validation Error", "Location coordinates are required");
      return;
    }

    setLoading(true);
    try {
      const officeData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        location: {
          lat: lat,
          lng: lng,
        },
        radius: formData.radius,
        workingHours: {
          start: formData.workStartTime,
          end: formData.workEndTime,
        },
        isActive: formData.isActive,
      };

      await officeService.createOffice(officeData);
      Alert.alert("Success", "Office created successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to create office");
    } finally {
      setLoading(false);
    }
  };

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

  const renderRadiusModal = () => {
    if (!showRadiusModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setShowRadiusModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Radius</Text>
              <View style={styles.modalDivider} />
            </View>
            <ScrollView style={styles.modalScroll}>
              {radiusOptions.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.modalItem,
                    formData.radius === value && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    handleChange("radius", value);
                    setShowRadiusModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.itemName,
                      formData.radius === value && styles.itemNameSelected,
                    ]}
                  >
                    {value} meters
                  </Text>
                  {formData.radius === value && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={() => setShowRadiusModal(false)}
            >
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Create Office"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.formTitle}>Office Information</Text>
            <Text style={styles.formSubtitle}>
              Add a new office location for GPS check-in
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Office Name *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => handleChange("name", text)}
                  placeholder="Enter office name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={formData.address}
                  onChangeText={(text) => handleChange("address", text)}
                  placeholder="Enter office address"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Latitude *</Text>
              <View style={styles.inputWrapper}>
                <LocationIcon width={20} height={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={formData.latitude}
                  onChangeText={(text) => handleChange("latitude", text)}
                  placeholder="e.g. 10.8231"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Longitude *</Text>
              <View style={styles.inputWrapper}>
                <LocationIcon width={20} height={20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={formData.longitude}
                  onChangeText={(text) => handleChange("longitude", text)}
                  placeholder="e.g. 106.6297"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderSelector(
              "Check-in Radius",
              `${formData.radius} meters`,
              "Select radius",
              () => setShowRadiusModal(true),
              RadiusIcon
            )}

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <View style={styles.inputWrapper}>
                  <ClockIcon width={20} height={20} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={formData.workStartTime}
                    onChangeText={(text) => handleChange("workStartTime", text)}
                    placeholder="09:00"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>End Time</Text>
                <View style={styles.inputWrapper}>
                  <ClockIcon width={20} height={20} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={formData.workEndTime}
                    onChangeText={(text) => handleChange("workEndTime", text)}
                    placeholder="18:00"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text={loading ? "Creating..." : "Create Office"}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </View>

      {renderRadiusModal()}
    </SafeAreaView>
  );
};

export default CreateOfficeScreen;

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
  },
  formSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  inputContainer: {
    gap: 8,
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
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  inputIcon: {
    marginRight: 12,
    tintColor: Colors.primary,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    padding: 0,
  },
  selectorContainer: {
    gap: 8,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
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
  },
  placeholderText: {
    color: "#999",
    fontWeight: "400",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeInput: {
    flex: 1,
    gap: 8,
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
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginTop: 16,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemSelected: {
    backgroundColor: Colors.frame,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  itemNameSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  modalButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonClose: {
    backgroundColor: "#F5F5F5",
  },
  modalButtonTextClose: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
