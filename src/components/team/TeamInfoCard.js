import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../../styles/color";
import TeamIcon from "../../../assets/icons/team_ac.svg";
import EditIcon from "../../../assets/icons/setting-2.svg";

const TeamInfoCard = ({ team, membersCount, onEdit, canEdit }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <TeamIcon width={32} height={32} />
        </View>
        <View style={{ flex: 1, marginLeft: 16, justifyContent: "center" }}>
          <Text style={styles.name}>{team.name}</Text>
          {team.description && (
            <Text style={styles.description}>{team.description}</Text>
          )}
        </View>
        {canEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <EditIcon width={20} height={20} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{membersCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {team.leaderId?.profile?.fullName || "N/A"}
          </Text>
          <Text style={styles.statLabel}>Team Lead</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E8E8E8",
    marginHorizontal: 16,
  },
});

export default TeamInfoCard;
