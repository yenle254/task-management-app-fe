import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../../styles/color";
import { displayNumber, isNumber, records } from '../../../utils/dashboardData';

const getCompletionRateBadge = (rate) => {
  if (!isNumber(rate)) return { color: Colors.black, bg: "#F2F4F7" };
  if (rate >= 70) return { color: "#047857", bg: "#ECFDF3" };
  if (rate >= 40) return { color: "#B45309", bg: "#FFF6ED" };
  return { color: "#B91C1C", bg: "#FEF3F2" };
};

const TeamPerformanceTable = ({ data }) => {
  if (!records(data)) return <Text style={styles.noData}>Not available: the response is missing these records.</Text>;
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <View style={styles.colTeam}>
          <Text style={[styles.tableHeaderText, { textAlign: "left" }]}>Team</Text>
        </View>
        <View style={styles.colStat}>
          <Text style={styles.tableHeaderText}>Members</Text>
        </View>
        <View style={styles.colStat}>
          <Text style={styles.tableHeaderText}>Completed</Text>
        </View>
        <View style={styles.colStat}>
          <Text style={styles.tableHeaderText}>Rate</Text>
        </View>
      </View>

      {data.length > 0 ? (
        data.map((team, index) => {
          const badge = getCompletionRateBadge(team.completionRate);
          const pct = isNumber(team.completionRate) ? Math.max(0, Math.min(100, team.completionRate)) : 0;
          return (
            <View key={team.teamId || index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <View style={[styles.colTeam, styles.teamCellWrap]}>
                <Text
                  style={[styles.tableCell, styles.teamNameText]}
                  numberOfLines={1}
                  accessibilityLabel={typeof team.teamName === 'string' ? team.teamName : 'Not available'}
                >
                  {typeof team.teamName === 'string' ? team.teamName : 'Not available'}
                </Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: badge.color }]} />
                </View>
              </View>
              <View style={styles.colStat}>
                <Text style={styles.tableCell}>{displayNumber(team.memberCount)}</Text>
              </View>
              <View style={styles.colStat}>
                <Text style={styles.tableCell}>
                  {isNumber(team.completedTasks) && isNumber(team.totalTasks) ? `${displayNumber(team.completedTasks)}/${displayNumber(team.totalTasks)}` : 'Not available'}
                </Text>
              </View>
              <View style={styles.colStat}>
                <View style={[styles.ratePill, { backgroundColor: badge.bg }]}>
                  <Text
                    style={[
                      styles.ratePillText,
                      { color: badge.color },
                    ]}
                  >
                    {displayNumber(team.completionRate, '%')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
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
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  colTeam: {
    width: "37%",
    minWidth: "37%",
    maxWidth: "37%",
    paddingRight: 8,
    justifyContent: "center",
  },
  colStat: {
    width: "21%",
    minWidth: "21%",
    maxWidth: "21%",
    alignItems: "center",
    justifyContent: "center",
  },
  tableHeaderText: {
    color: "#475467",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  tableRowAlt: {
    backgroundColor: "#FCFCFD",
  },
  teamCellWrap: {
    gap: 5,
  },
  teamNameText: {
    textAlign: "left",
    fontWeight: "600",
    color: "#101828",
  },
  miniTrack: {
    height: 5,
    backgroundColor: "#F2F4F7",
    borderRadius: 999,
    overflow: "hidden",
  },
  miniFill: {
    height: "100%",
    borderRadius: 999,
  },
  tableCell: {
    textAlign: "center",
    fontSize: 12,
    color: "#344054",
  },
  ratePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noData: {
    textAlign: "center",
    color: "#667085",
    padding: 30,
    fontSize: 14,
  },
});

export default TeamPerformanceTable;
