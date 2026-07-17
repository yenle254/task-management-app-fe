import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import Colors from "../styles/color"

const ProgressBar = ({ progress = 0, color }) => {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const progressColor = color || Colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.progress, 
          { width: `${clamped}%`, backgroundColor: progressColor }
        ]}
      />
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    height: 5,
    backgroundColor: "#D9D6FE",
    borderRadius: 8,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 8,
  },
});

