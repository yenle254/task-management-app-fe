import React from "react";
import { StyleSheet, Text, View } from "react-native";
import NoTask from "../../../assets/icons/notask.svg";
import { useTaskStore } from '../../../store';
import Colors from "../../styles/color";
import AppNumber from "../appNumber";
import CardTask from "../task/cardTask";


const TaskCard = () => {
  const { myTasks } = useTaskStore();
  const tasks = myTasks.filter(t => ['in_progress', 'pending'].includes(t.status)).slice(0, 5);


  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View
            style={{ flexDirection: "row", alignContent: "center", gap: 5 }}
          >
            <Text style={styles.txt1}>Today tasks</Text>
            {tasks.length > 0 && <AppNumber number={tasks.length} />}
          </View>
          <Text style={styles.txt2}>
            These tasks assigned to you for the day, do not forget to check it!
          </Text>
        </View>
        {tasks.length === 0 ? (
          <View style={styles.noTask}>
            <NoTask width={126} height={86} />
            <Text style={{ fontSize: 19, fontWeight: "bold" }}>
              No Task Assigned
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "#555555ff",
              }}
            >
              It looks like you don't have any task right now. This place will
              be updated as new task are added!!!
            </Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <View key={index} style={styles.isTasked}>
              <CardTask
                name={task.title || task.name}
                description={task.description || ""}
                endDate={task.dueDate 
                  ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                  : task.endDate || "No date"}
                comment={task.comments?.length || task.comment || 0}
                progress={task.progress || 0}
                category={task.status || task.category}
                flag={task.priority || task.flag || "medium"}
                assignees={task.assignedTo || []}
              />
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default TaskCard;

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
  noTask: {
    alignItems: "center",
    gap: 13,
  },
  isTasked: {
    marginBottom: 10,
  },
});
