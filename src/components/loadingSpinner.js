import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import Colors from "../styles/color";

const LoadingSpinner = ({ text = "Loading...", size = "large" }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
});

export default LoadingSpinner;
