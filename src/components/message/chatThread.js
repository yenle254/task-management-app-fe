import React from "react"
import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import Avatar from "../avatar"
import OnlineBadge from "./onlineBadge"
import Colors from "../../styles/color"

const chatThread = ({thread, onPress}) => {
    return (
        <Pressable
            onPress={onPress}
            style={styles.container}
        >
            <View style={styles.avatarWrapper}>
                <View style={styles.avatarContainer}>
                    {thread.profile?.avatar ? (
                      <Image 
                        source={{ uri: thread.profile.avatar }} 
                        style={styles.avatar} 
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {thread.profile?.fullName?.charAt(0)?.toUpperCase() || thread.email?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                </View>
                <OnlineBadge style={styles.badge} userId={thread.userId} />
            </View>
            <View style={styles.content}>
                            <View style={styles.mid}>
                <Text style={styles.threadName}>{thread.name}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{thread.lastMessage}</Text>
            </View>
            <View style={styles.right}>
                <Text style={styles.time}>{thread.time}</Text>
                {thread.unreadCount > 0 && (
                    <View style={styles.unreadCountContainer}>
                        <Text style={styles.unreadCountText}>{thread.unreadCount}</Text>
                    </View>
                )}
            </View>
            </View>
        </Pressable>
    )
}


export default chatThread

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0.2,
    borderBottomColor: "#ccc",
    height: 90,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16
  },
  mid: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  threadName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: "#999999",
  },
  unreadCountContainer: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  avatarWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    marginRight: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    marginLeft: 10,
  },
  badge: {
    position: 'absolute',
    right: -13,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#fff', 
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
})



