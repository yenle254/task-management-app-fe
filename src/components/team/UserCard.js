import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../../styles/color";
import Avatar from "../avatar";

const UserCard = memo(
  ({ user, isSelected, onToggle, isAlreadyMember, disabledReason }) => {
    const isDisabled = !!disabledReason || !!isAlreadyMember;
    const badgeText =
      disabledReason || (isAlreadyMember ? "Already a member" : null);
    const avatarUrl = user.profile?.avatar || null;
    const avatarKey = "avt1";

    return (
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.containerSelected,
          isDisabled && styles.containerDisabled,
        ]}
        onPress={() => !isDisabled && onToggle(user)}
        disabled={isDisabled}
      >
        <View style={styles.left}>
          <Avatar url={avatarUrl} name={avatarKey} width={48} height={48} />
          <View style={styles.info}>
            <Text style={styles.name}>
              {user.profile?.fullName || user.email}
            </Text>
            <Text style={styles.position}>
              {user.profile?.position || "Employee"} •{" "}
              {user.profile?.department || "No Department"}
            </Text>
            {badgeText && (
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>{badgeText}</Text>
              </View>
            )}
          </View>
        </View>

        {!isDisabled && (
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          >
            {isSelected && <View style={styles.checkboxInner} />}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  containerDisabled: {
    opacity: 0.5,
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
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  position: {
    fontSize: 13,
    color: "#666666",
  },
  memberBadge: {
    backgroundColor: "#FFD700" + "40",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B8860B",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
});

export default UserCard;
