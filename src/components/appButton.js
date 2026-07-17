import { Pressable, Text, StyleSheet } from "react-native";
import React from "react";
import Colors from "../styles/color";

const AppButton = ({ text, onPress, style, textStyle }) => {
    const defaultBackgroundColor = Colors.button;

    return (
        <Pressable
            onPress={onPress} 
            style={({ pressed }) => [
                styles.btnBase,
                {
                    backgroundColor: pressed 
                        ? defaultBackgroundColor + 'cc'
                        : defaultBackgroundColor,
                },
                style,
            ]}
        >
            <Text style={[styles.btnText, textStyle]}>{text}</Text>
        </Pressable>
    );
};

export default AppButton;

const styles = StyleSheet.create({
    btnBase: {
        width: 55,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
        alignSelf: "center",
    },
    btnText: {
        color: 'white', 
        fontWeight: '500',
        fontSize: 10,
    }
});