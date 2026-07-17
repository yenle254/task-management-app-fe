import { View, Text, StyleSheet } from "react-native"
import React from "react";

const IconCardText = ({ icon, text, subtext, subtextStyle, textStyle }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <View style={styles.icon}>
                    {icon}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.text, textStyle]}>{text}</Text>
                </View>
            </View>
            <View style={styles.subtextContainer}>
                <Text style={[styles.subtext, subtextStyle]}>{subtext}</Text>
            </View>
        </View>
    )
}

export default IconCardText;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginHorizontal: 4,
        flex: 1,
        backgroundColor: "#efefef54",
        borderRadius: 15,
        padding: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#e2e2e276",
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 5,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    subtextContainer: {
        marginTop: 4,
    },
    subtext: {
        fontSize: 14,
        fontWeight: '400',
        color: '#666666',
    },
})
