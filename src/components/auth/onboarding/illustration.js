import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Colors from "../../../styles/color";
import CardMeeting from "../../cardMeeting";
import CardTask from "../../task/cardTask";

const { width, height } = Dimensions.get("window");

const Illustration = () => {
  return (
    <View style={styles.illustrationContainer}>
      <View style={[styles.card3D, styles.card1]}>
        <CardMeeting
          name="Today Meeting"
          timeStart="01:50 AM"
          timeEnd="03:00 AM"
          description="Your schedule for the day"
          assignees={["John Doe", "Jane Smith"]}
        />
      </View>
      <View style={[styles.card3D, styles.card2]}>
        <CardTask
          name="Today Task"
          endDate="27 April"
          comment="2"
          progress={0.75}
          category="Design"
          flag="High"
          bgColor={Colors.frame}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    width: width * 0.9,
    height: height * 0.45,
    position: "relative",
  },
  card3D: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  card1: {
    top: 50,
    left: 20,
    right: 20,
    transform: [{ rotate: "0deg" }],
    zIndex: 1,
  },
  card2: {
    top: 150,
    left: 30,
    right: 10,
    transform: [{ rotate: "0deg" }],
    zIndex: 2,
  },
});

export default Illustration;
