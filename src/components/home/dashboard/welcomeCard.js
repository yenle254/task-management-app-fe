import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Welcome from "../../../../assets/icons/dashboard.svg";
import Colors from "../../../styles/color";

const WelcomeCard = ({ title, subtitle }) => {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.left}>
        <Text style={styles.welcomeTitle}>{title}</Text>
        <Text style={styles.welcomeSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.right}>
        <Welcome width={100} height={100} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeCard: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 6,
    opacity: 0.9,
  },

  left: {
    flex: 1,
  },
  right: {
    marginLeft: 10,
  },
});

export default WelcomeCard;
