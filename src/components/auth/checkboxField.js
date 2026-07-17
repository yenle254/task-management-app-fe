import React from "react";
import { Controller } from "react-hook-form";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CheckboxField = ({ name, control, error, children, onLinkPress }) => (
  <>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onChange(!value)}
          >
            {value && <View style={styles.checkboxChecked} />}
          </TouchableOpacity>
          <View style={styles.textContainer}>{children}</View>
        </View>
      )}
    />
    {error && <Text style={styles.errorText}>{error.message}</Text>}
  </>
);

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    marginRight: 8,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
  },
  textContainer: {
    flex: 1,
  },
  errorText: {
    color: "red",
    fontSize: 11,
    marginTop: -20,
    marginBottom: 16,
    marginLeft: 4,
  },
});

export default CheckboxField;
