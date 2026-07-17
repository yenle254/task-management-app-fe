import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../../../styles/color";
import AppButton from "../../appButton";
import PagerIndicator from "./pageIndicator";

const OnboardingFooter = ({ currentIndex, totalSlides, onNext, onSkip }) => {
  const getButtonTitle = () => {
    return currentIndex === totalSlides - 1 ? "Start" : "Next";
  };

  return (
    <View style={styles.footer}>
      <View style={styles.indicatorContainer}>
        <PagerIndicator currentIndex={currentIndex} totalSlides={totalSlides} />
      </View>

      <View style={styles.buttonContainer}>
        <AppButton
          text={getButtonTitle()}
          onPress={onNext}
          style={{ width: 326, height: 40, borderRadius: 100 }}
          textStyle={{ fontSize: 14, fontWeight: "600" }}
        />

        <TouchableOpacity style={styles.skipButtonBottom} onPress={onSkip}>
          <Text style={styles.skipTextBottom}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  skipButtonBottom: {
    alignItems: "center",
    borderColor: Colors.button,
    borderWidth: 1,
    width: 326,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
  },
  skipTextBottom: {
    color: Colors.button,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default OnboardingFooter;
