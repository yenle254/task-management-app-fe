import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../../styles/color";

const getCompletionRateColor = (rate) => {
  if (rate >= 70) return "#10B981";
  if (rate >= 40) return "#F59E0B";
  return "#EF4444";
};

const TeamPerformanceTable = ({ data }) => {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Team</Text>
        <Text style={styles.tableHeaderText}>Members</Text>
        <Text style={styles.tableHeaderText}>Completed</Text>
        <Text style={styles.tableHeaderText}>Rate</Text>
      </View>

      {data.length > 0 ? (
        data.map((team, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
              {team.teamName}
            </Text>
            <Text style={styles.tableCell}>{team.memberCount}</Text>
            <Text style={styles.tableCell}>
              {team.completedTasks}/{team.totalTasks}
            </Text>
            <Text
              style={[
                styles.tableCell,
                {
                  color: getCompletionRateColor(team.completionRate),
                  fontWeight: "600",
                },
              ]}
            >
              {team.completionRate}%
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noData}>No team data available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    flex: 1,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 11,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#374151",
  },
  noData: {
    textAlign: "center",
    color: "#9CA3AF",
    padding: 30,
    fontSize: 14,
  },
});

export default TeamPerformanceTable;
