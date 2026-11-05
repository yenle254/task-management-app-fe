import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeaderPromo = ({text, subtext, color, style, titleStyle, subtitleStyle}) => {
    return (
        <View style={[styles.container, {backgroundColor: color}, style]}>
            <Text style={[styles.promoText, titleStyle]}>{text}</Text>
            <Text style={[styles.subText, subtitleStyle]}>{subtext}</Text>
        </View>
    )   
}

export default HeaderPromo;

const styles = StyleSheet.create({
    container: {
        height: 223,
        borderBottomRightRadius: 32,
        borderBottomLeftRadius: 32,
    },
    promoText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 60,
        marginLeft: 24,
    },
    subText: {
        color: '#e2e2e2ff',
        fontSize: 14,
        fontWeight: '400',
        marginTop: 8,
        marginLeft: 24,
        marginRight: 48,
    },
})
