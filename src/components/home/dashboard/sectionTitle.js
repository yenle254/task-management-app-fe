import React from "react";
import { Text, StyleSheet } from "react-native";
import Colors from "../../../styles/color";

const SectionTitle = ({ children }) => {
  return <Text style={styles.sectionTitle}>{children}</Text>;
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.black,
    marginTop: 16,
    marginBottom: 12,
  },
});

export default SectionTitle;
