import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from '../../styles/color';

const WelcomeCard = () => {
  return (
    <View style={styles.wrapper}>
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.text1}>Welcome Back</Text>
        <Text style={styles.text2}>Checkout today tasks!</Text>
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
        minHeight: 100,
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
