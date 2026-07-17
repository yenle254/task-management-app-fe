import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Clock from "../../assets/icons/clock.svg";
import Meeting from "../../assets/icons/meeting.svg";
import AppButton from "../components/appButton";
import Colors from "../styles/color";
import AppIcon from "./appIcon";
import Avatar from "./avatar";

const CardMeeting = ({ name, timeStart, timeEnd, description, assignees }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppIcon
            icon={<Meeting width={12} height={12} />}
            width={24}
            height={24}
            color={Colors.primary}
          />
          <Text style={styles.nameText}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Clock width={16} height={16} />
          <Text style={styles.time}>
            {timeStart} - {timeEnd}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.bottom}>
          <View style={{ flexDirection: "row"}}>
            {(assignees || []).map((assigneeName, index) => (
              <Avatar
                key={index}
                name={assigneeName}
                width={30}
                height={30}
                style={{ marginRight: 5 }}
              />
            ))}
          </View>
          <AppButton text="Details" />
        </View>
      </View>
    </View>
  );
};

export default CardMeeting;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.frame,
    borderRadius: 15,
    padding: 15,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "450",
    color: "#555555ff",
  },

});
