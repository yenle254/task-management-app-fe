import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Colors from "../../styles/color"
import ProgressBar from "../progressBar";
import { CategoryMap } from "@/src/utils/categoryMapping";

const TaskStatusCard = ({ todoCount, inProgressCount, doneCount }) => {
  const MatDoTucGian = CategoryMap["mat_do_tuc_gian"];
  const MatCamBuon = CategoryMap["mat_cam_buon"];
  const MatXanhCuoiLon = CategoryMap["mat_xanh_cuoi_lon"];
  const MatVangMiengNgang = CategoryMap["mat_vang_mieng_ngang"];

  const totalTasks = todoCount + inProgressCount + doneCount;
  const completionRate = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
  const pendingRate = totalTasks > 0 ? ((todoCount + inProgressCount) / totalTasks) * 100 : 0;

  const getStatus = () => {
    if (totalTasks === 0) {
      return {
        icon: <MatXanhCuoiLon width={32} height={32} />,
        title: "All clear",
        tagText: "Good",
        tagColor: "#22c55e",
        tagBgColor: "#dcfce7",
        message: "No tasks assigned yet. Ready to take on new challenges!",
        progress: 100,
        progressColor: "#22c55e",
      };
    }

    if (todoCount === 0 && inProgressCount === 0 && doneCount > 0) {
      return {
        icon: <MatXanhCuoiLon width={32} height={32} />,
        title: "Early completion",
        tagText: "Good",
        tagColor: "#22c55e",
        tagBgColor: "#dcfce7",
        message: "Task list is at Zero! You've defeated the system and unlocked the 'Ultimate Freedom' level.",
        progress: 100,
        progressColor: "#22c55e",
      };
    }

    if (pendingRate < 50) {
      return {
        icon: <MatVangMiengNgang width={32} height={32} />,
        title: "Good progress",
        tagText: "Okay",
        tagColor: "white",
        tagBgColor: "#e9e629ff",
        message: `Solid progress! ${todoCount + inProgressCount} items remain. Think of it as halftime. You're winning, but keep the momentum!`,
        progress: completionRate,
        progressColor: "#fdf03fff",
      };
    }

    if (pendingRate >= 50 && pendingRate < 75) {
      return {
        icon: <MatCamBuon width={32} height={32} />,
        title: "Needs attention",
        tagText: "Struggle",
        tagColor: "white",
        tagBgColor: "#FD824C",
        message: `You have ${todoCount + inProgressCount} pending tasks. Don't worry, even superheroes need a break sometimes! Grab your coffee and tackle them one by one.`,
        progress: completionRate,
        progressColor: "#f59e0b",
      };
    }

    return {
      icon: <MatDoTucGian width={32} height={32} />,
      title: "Overwhelmed",
      tagText: "Bad",
      tagColor: "white",
      tagBgColor: "#c72323ff",
      message: `Code Red alert! ${todoCount + inProgressCount} tasks are staging a deadline breakout. Your mission, should you choose to accept it, is to stop them!`,
      progress: completionRate,
      progressColor: "#ef4444",
    };
  };

  const status = getStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{status.title}</Text>
          <View
            style={[
              styles.tag,
              { backgroundColor: status.tagBgColor },
            ]}
          >
            <Text style={[styles.tagText, { color: status.tagColor }]}>
              {status.tagText}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.message}>{status.message}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.iconContainer}>{status.icon}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <ProgressBar progress={status.progress} color={status.progressColor} />
        </View>
      </View>
    </View>
  );
};

export default TaskStatusCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconContainer: {
    marginLeft: 12,
  },
  message: {
    fontSize: 13,
    textAlign: "justify",
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 4,
    alignItems: "center",
    flexDirection: "row",
  },
});

