import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CalendarAlert from "../../../assets/icons/calendar-alert.svg";
import NoTask from "../../../assets/icons/notask.svg";
import { useTaskStore } from "../../../store";
import Colors from "../../styles/color";
import AppNumber from "../appNumber";
import CardTask from "../task/cardTask";

const OverdueTaskCard = ({ navigation }) => {
  const { myTasks } = useTaskStore();

  const getOverdueTasks = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueTasks = [...myTasks]
      .filter(task => {
        if (task.status === "done" || task.status === "deleted") {
          return false;
        }

        if (!task.dueDate) {
          return false;
        }

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);

        return due < now;
      })
      .map(task => {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        
        return { 
          ...task, 
          daysOverdue: diffDays,
          dueLabel: `Overdue ${diffDays}d`
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return overdueTasks;
  };

  const overdueTasks = getOverdueTasks();

  if (overdueTasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CalendarAlert width={20} height={20} />
            <Text style={styles.title}>Overdue tasks</Text>
            <AppNumber number={overdueTasks.length} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Main', {
              screen: 'task',
              params: {
                  screen: 'TaskScreen',
              }
          })
          }>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Tasks that are past their due date
        </Text>

        <View style={styles.taskList}>
          {overdueTasks.map((task) => (
            <TouchableOpacity
              key={task._id}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task._id })}
              activeOpacity={0.7}
            >
              <View style={styles.taskItem}>
                <CardTask
                  name={task.title}
                  description={task.description || ""}
                  endDate={task.dueLabel}
                  comment={task.comments?.length || 0}
                  progress={task.progress || 0}
                  category={task.status}
                  flag={task.priority || "medium"}
                  assignees={task.assignedTo || []}
                  dueDate={task.dueDate}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: 16,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: "92%",
    borderWidth: 1,
    borderColor: "#FFEBEB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    marginBottom: 4,
  },
});

export default OverdueTaskCard;
