import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Colors from "../../../styles/color";
import Illustration from "./illustration";

const { width, height } = Dimensions.get("window");

const Slide = ({ item }) => {
  const renderIllustration = () => {
    return <Illustration />;
  };

  return (
    <View style={styles.slide}>
      <View style={styles.illustrationSection}>{renderIllustration()}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    width: width,
    height: height,
  },
  illustrationSection: {
    height: height * 0.55,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default Slide;
