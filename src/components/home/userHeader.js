import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Message from "../../../assets/icons/message.svg";
import Notification from "../../../assets/icons/notification.svg";
import { useAuth } from "../../../src/contexts/authContext";
import Colors from "../../styles/color";
import AppIcon from "../appIcon";
import Avatar from "../avatar";
import MessageBadge from "./messageBadge";
import NotificationBadge from "./notificationBadge";

const UserHeader = ({ navigation }) => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.left}>
          <View style={[styles.avatarPlaceholder]} />
          <View>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  const displayName =
    user.profile?.fullName || user.email?.split("@")[0] || "User";
  const email = user.email || "";

  const avatarUrl = user.profile?.avatar || null;
  const avatarKey = "avt1";
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.left}
        onPress={() => navigation.navigate("Profile")}
      >
        <View style={styles.avatarWrapper}>
          <Avatar url={avatarUrl} name={avatarKey} width={46} height={46} />
          {/* {user.isOnline && <View style={styles.onlineDot} />} */}
        </View>

        <View style={styles.leftName}>
          <Text style={styles.leftUsername} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.leftUsermail} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </Pressable>

      <View style={styles.right}>
        <AppIcon
          icon={<Message width={18} height={18} />}
          width={44}
          height={44}
          color={Colors.secondary}
          onPress={() => navigation.navigate("Message")}
        />
        <MessageBadge />

        <View style={styles.notificationWrapper}>
          <AppIcon
            icon={<Notification width={18} height={18} />}
            width={44}
            height={44}
            color={Colors.secondary}
            onPress={() => navigation.navigate("Notification")}
          />
          <NotificationBadge />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#34C759",
    borderWidth: 3,
    borderColor: Colors.white,
  },
  leftName: {
    flex: 1,
  },
  leftUsername: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  leftUsermail: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  notificationWrapper: {
    position: "relative",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#eee",
  },
});

export default UserHeader;
