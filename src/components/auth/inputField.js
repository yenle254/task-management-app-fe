import React from "react";
import { Controller } from "react-hook-form";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../../styles/color";

const InputField = ({
  name,
  icon: Icon,
  label,
  placeholder,
  control,
  error,
  secureTextEntry,
  keyboardType,
  showToggle,
  onTogglePress,
  rightIcon: RightIcon,
}) => (
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
            {Icon && <Icon width={20} height={20} style={styles.icon} />}
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              autoCapitalize="none"
            />
            {showToggle && RightIcon && (
              <TouchableOpacity onPress={onTogglePress} style={styles.eyeIcon}>
                <RightIcon width={20} height={20} />
              </TouchableOpacity>
            )}
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
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: Colors.black,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: "red",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default InputField;
