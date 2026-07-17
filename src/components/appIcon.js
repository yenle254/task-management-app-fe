import { Pressable, StyleSheet, View } from "react-native";
import React from "react";
import Colors from "../styles/color";

const AppIcon = ({icon, width, height, color, onPress}) => {
    const widthContainer = width
    const heightContainer = height
    const colorContainer = color
    return (
        <Pressable
            onPress={onPress}
            style={({pressed}) => [
                styles.icon,
            ]}
        >
            <View style={[
                styles.container,
                { 
                    width: widthContainer, 
                    height: heightContainer,
                    borderRadius: widthContainer / 2,
                    backgroundColor: colorContainer, 
                }
            ]}>
                {icon}
            </View>
        </Pressable>
    )
}


export default AppIcon;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  }
})
