import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import NoSchedule from "../../../assets/icons/no_schedules.svg";
import { useTaskStore } from '../../../store';
import Colors from "../../styles/color";
import AppNumber from "../appNumber";
import CardMeeting from "../cardMeeting";


const Schedules = ({navigation}) => {
  const { myTasks } = useTaskStore();
  const schedules = myTasks.slice(0, 3);

  return (
    <ScrollView>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignContent: "center", gap: 5 }}>
              <Text style={styles.txt1}>Today schedules</Text>
              {schedules.length > 0 && <AppNumber number={schedules.length} />}
            </View>
            <Text style={styles.txt2}>
              Your schedules for the day, do not forget to check it!
            </Text>
          </View>
          {schedules.length === 0 ? (
            <View style={styles.noSchedule}>
              <NoSchedule width={126} height={86} />
              <Text style={{ fontSize: 19, fontWeight: "bold" }}>
                No Schedule Available
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  color: "#555555ff",
                }}
              >
                It looks like you don&apos;t have any schedule right now. This place
                will be updated as new schedules are added!!!
              </Text>
            </View>
          ) : (
            schedules.map((schedule, index) => (
              <View key={index} style={styles.isScheduled}>
                <CardMeeting
                  name={schedule.name}
                  timeStart={schedule.timeStart}
                  timeEnd={schedule.timeEnd}
                  description={schedule.description}
                  assignees={schedule.assignees}
                />
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Schedules;

const styles = StyleSheet.create({
  wrapper: {
    alignContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    width: "90%",
  },
  header: {
    marginBottom: 10,
  },
  txt1: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  txt2: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 10,
    color: "#555555ff",
  },
  noSchedule: {
    alignItems: "center",
    gap: 13,
  },
  isScheduled: {
    marginBottom: 10,
  },
});
