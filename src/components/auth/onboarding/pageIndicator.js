import React from "react";
import { StyleSheet, View } from "react-native";
import Colors from "../../../styles/color";

const PagerIndicator = ({ currentIndex, totalSlides }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSlides }, (_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            index === currentIndex && styles.indicatorActive,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.button,
  },
});

export default PagerIndicator;
