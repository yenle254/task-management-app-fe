import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Colors from "../../styles/color"

const SmallCard = ({totalHours, inOutTime, isAbsent}) => {
    return (
        <View style={[styles.container, isAbsent && styles.absentContainer]}>
            <View style={styles.left}>
                <Text style={[styles.topText, isAbsent && styles.absentText]}>Total hours</Text>
                <Text style={[styles.bottomText, isAbsent && styles.absentText]}>
                    {isAbsent ? '0:00 hrs' : totalHours}
                </Text>
            </View>
            <View style={styles.right}>
                <Text style={[styles.topText, isAbsent && styles.absentText]}>Clock-in & out</Text>
                <Text style={[styles.bottomText, isAbsent && styles.absentText]}>
                    {isAbsent ? 'No record' : inOutTime}
                </Text>
            </View>
        </View>
    )
}

export default SmallCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.gray,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderGray,
        flexDirection: 'row',
    },
    absentContainer: {
        backgroundColor: '#F9F9F9',
        borderColor: '#E0E0E0',
    },
    left: {
        flex: 1,
        padding: 12,
    },
    right: {
        flex: 1,
        padding: 12,
    },
    topText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#535353ff',
    },
    bottomText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        marginTop: 4,
    },
    absentText: {
        color: '#999999',
    },
})
