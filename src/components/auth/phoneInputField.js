import React from "react";
import { Controller } from "react-hook-form";
import { StyleSheet, Text, TextInput, View } from "react-native";
import PhoneIcon from "../../../assets/icons/phone.svg";
import Colors from "../../styles/color";

const PhoneInputField = ({ name, label, control, error }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View
            style={[styles.inputWrapper, error && styles.inputWrapperError]}
          >
            <PhoneIcon width={20} height={20} style={styles.icon} />
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCode}>VN</Text>
              <Text style={styles.countryCodeSeparator}>+84</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="0123456789"
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
            />
          </View>
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </>
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: Colors.white,
    height: 48,
  },
  inputWrapperError: {
    borderColor: "red",
  },
  icon: {
    marginLeft: 12,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: Colors.black,
  },
  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    marginRight: 8,
  },
  countryCode: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: "500",
    marginRight: 8,
  },
  countryCodeSeparator: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    color: "red",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default PhoneInputField;
