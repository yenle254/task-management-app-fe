import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../../styles/color";
import Avatar from "../avatar";

const MemberCard = ({
  member,
  isLeader,
  onRemove,
  canRemove,
  onChangeRole,
  canChangeRole,
}) => {
  const avatarUrl = member.profile?.avatar || null;
  const avatarKey = "avt1";
  const isEditableRole =
    member.role === "employee" || member.role === "team_lead";

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Avatar userId={member._id} url={avatarUrl} name={avatarKey} width={48} height={48} />
        <View style={styles.info}>
          <Text style={styles.name}>
            {member.profile?.fullName || member.email}
          </Text>
          <Text style={styles.position}>
            {member.profile?.position || "Employee"}
          </Text>
          {isLeader ? (
            <View style={styles.leaderBadge}>
              <Text style={styles.leaderBadgeText}>Team lead</Text>
            </View>
          ) : member.role === "team_lead" ? (
            <View style={styles.roleBadgeLead}>
              <Text style={styles.roleBadgeLeadText}>Role: Team Lead</Text>
            </View>
          ) : (
            <View style={styles.roleBadgeEmployee}>
              <Text style={styles.roleBadgeEmployeeText}>Role: Employee</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {canChangeRole && !isLeader && isEditableRole && onChangeRole && (
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => onChangeRole(member)}
          >
            <Text style={styles.roleButtonText}>
              {member.role === "team_lead" ? "Set Employee" : "Set Lead"}
            </Text>
          </TouchableOpacity>
        )}

        {canRemove && !isLeader && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(member)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  position: {
    fontSize: 12,
    color: "#666666",
  },
  leaderBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  roleBadgeLead: {
    backgroundColor: Colors.frame,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleBadgeLeadText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
  roleBadgeEmployee: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleBadgeEmployeeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666666",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  roleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.frame,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default MemberCard;
