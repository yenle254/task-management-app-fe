import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Clock from "../../assets/icons/clock.svg";
import Meeting from "../../assets/icons/meeting.svg";
import AppButton from "../components/appButton";
import Colors from "../styles/color";
import AppIcon from "./appIcon";
import Avatar from "./avatar";

const CardMeeting = ({ name, timeStart, timeEnd, timeLabel, description, assignees = [], onPress }) => {
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
          <Text style={styles.nameText} numberOfLines={2}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Clock width={16} height={16} />
          <Text style={styles.time}>
            {timeLabel || [timeStart, timeEnd].filter(Boolean).join(' – ') || 'Time not set'}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        {!!description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
        <View style={styles.bottom}>
          <View style={{ flexDirection: "row"}}>
            {assignees.slice(0, 3).map((assignee, index) => (
              <Avatar userId={assignee}
                key={index}
                name={typeof assignee === 'string' ? assignee : assignee.profile?.fullName || assignee.email}
                url={typeof assignee === 'object' ? assignee.profile?.avatar : undefined}
                width={30}
                height={30}
                style={{ marginRight: 5 }}
              />
            ))}
            {assignees.length > 3 && <Text style={styles.moreAssignees}>+{assignees.length - 3}</Text>}
          </View>
          <AppButton text="Details" onPress={onPress} />
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
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "black",
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: {
    maxWidth: '100%',
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  time: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "450",
    color: "#555555ff",
  },
  moreAssignees: { alignSelf: 'center', fontSize: 12, color: Colors.primary },

});
