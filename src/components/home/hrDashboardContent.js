import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View, Text } from "react-native";
import { useStatisticsStore } from "../../../store/index";
import Colors from "../../styles/color";
import {
  AttendanceDailyChart,
  LeaveTypeChart,
  MonthlyLeaveChart,
  OverviewCards,
  SectionTitle,
  TaskStatusChart,
  TeamPerformanceChart,
  TeamPerformanceTable,
  WelcomeCard,
} from "./dashboard";

const HRDashboardContent = ({ onRefresh }) => {
  const {
    overview,
    taskStats,
    leaveStats,
    attendanceStats,
    teamPerformance,
    isLoading,
    isRefreshing,
    loadAllStats,
    refreshStats,
    isCacheValid,
  } = useStatisticsStore();

  useEffect(() => {
    if (!isCacheValid() || !overview) {
      loadAllStats(false);
    } else {
      console.log("Using cached HR dashboard data");
    }
  }, []); 

  useEffect(() => {
    if (onRefresh) {
      onRefresh.current = async () => {
        await refreshStats();
      };
    }
  }, [onRefresh, refreshStats]);

  const shouldShowLoading = isLoading && !overview;

  if (shouldShowLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WelcomeCard title="HR Dashboard" subtitle="Company activity overview" />

      <SectionTitle>Overview</SectionTitle>
      <OverviewCards data={overview} />

      <SectionTitle>Task Status</SectionTitle>
      <TaskStatusChart data={taskStats} />

      <SectionTitle>Attendance (This Month)</SectionTitle>
      <AttendanceDailyChart data={attendanceStats} />

      <SectionTitle>Leave Types</SectionTitle>
      <LeaveTypeChart data={leaveStats} />

      <SectionTitle>Team Performance (%)</SectionTitle>
      <TeamPerformanceChart data={teamPerformance} />

      <SectionTitle>Monthly Leave Requests</SectionTitle>
      <MonthlyLeaveChart data={leaveStats} />

      <SectionTitle>Team Performance Details</SectionTitle>
      <TeamPerformanceTable data={teamPerformance} />

      <View style={{ height: 30 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  refreshingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  refreshingText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
});

export default HRDashboardContent;