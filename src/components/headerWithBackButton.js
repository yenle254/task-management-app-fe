import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Back from "../../assets/icons/back.svg";
import Colors from "../styles/color";

const HeaderWithBackButton = ({ title, onBackPress }) => {
    
    return (
        <View style={styles.container}>
            <Pressable style={styles.left} onPress={onBackPress}>
                <Back width={36} height={36}/> 
            </Pressable>
            <View style={styles.center}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <View style={styles.right} /> 
        </View>
    );
};

export default HeaderWithBackButton;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: '100%',
        zIndex: 10,
        height: 70,
        backgroundColor: Colors.white,
    },
    left: {
        width: 60,
        alignItems: 'flex-start',
        paddingLeft: 25,

    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    right: {
        width: 60,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: 'center',
    }
});