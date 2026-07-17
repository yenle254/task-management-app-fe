import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Welcome from "../../../assets/icons/welcome.svg";

import Colors from '../../styles/color';

const WelcomeCard = () => {
  return (
    <View style={styles.wrapper}>
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.text1}>Welcome back!!</Text>
        <Text style={styles.text2}>Checkout today task.</Text>
      </View>
      <View style={styles.right}>
        <Welcome width={100} height={100} />
      </View>
    </View>
    </View>
  );
};

export default WelcomeCard;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
    },
    container: {
        backgroundColor: Colors.primary,
        borderRadius: 15,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
        width: "90%",
        alignContent: "center",
        alignItems: "center",
    },
    left: {
        flexDirection: "column",
        gap: 10,
        marginLeft: 5,
    },
    text1: {
        fontSize: 20,
        fontWeight: "600",
        color: Colors.white,
    },
    text2: {
        fontSize: 14,
        fontWeight: "400",
        color: Colors.white,
    }
});
