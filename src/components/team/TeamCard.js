import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../../styles/color";
import TeamIcon from "../../../assets/icons/team_ac.svg";
import UserIcon from "../../../assets/icons/user.svg";

const TeamCard = ({ team, onPress }) => {
  const memberCount = team.memberIds?.length || 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <TeamIcon width={24} height={24} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{team.name}</Text>
          {team.description && (
            <Text style={styles.description} numberOfLines={2}>
              {team.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.memberCount}>
          <UserIcon width={16} height={16} />
          <Text style={styles.memberCountText}>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </Text>
        </View>
        {team.leaderId && (
          <Text style={styles.leaderText}>
            Lead: {team.leaderId.profile?.fullName || team.leaderId.email}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberCountText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  leaderText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
});

export default TeamCard;
