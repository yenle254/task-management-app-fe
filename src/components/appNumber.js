import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Colors from "../styles/color";

const AppNumber = ({ number }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{number}</Text>
        </View>
    )
}

export default AppNumber;


const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  }
})
