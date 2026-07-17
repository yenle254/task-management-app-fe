import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CategoryMap, DefaultCategory } from "../utils/categoryMapping";

const TaskCategory = ({icon, name, bgColor, textColor}) => {
    const key = icon
    const Svg = CategoryMap[key] || DefaultCategory

    return (
        <View style={[styles.container, {backgroundColor: bgColor || "#EAECF0"}]}>
            <Svg width={16} height={16} />
            <Text style={{marginLeft: 8, color: textColor, fontWeight:"bold"}}>{name}</Text>        
        </View>
    )
}

export default TaskCategory;


const styles = StyleSheet.create({
  container: {
    backgroundColor: "#EAECF0",
    borderRadius: 16,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    maxWidth: 120,
    justifyContent: "center",
    height: 32,
    paddingHorizontal: 12,
    marginRight: 10,
  }
})
