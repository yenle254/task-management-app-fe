import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "../../styles/color";

const AuthHeader = ({ title, subtitle, showLogo = true }) => (
  <View style={styles.header}>
    {showLogo && (
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>
      </View>
    )}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
});

export default AuthHeader;
