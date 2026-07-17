import { useAuth } from "@/src/contexts/authContext";
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import SendIcon from "../../../assets/icons/send.svg";
import useTaskStore from "../../../store/taskStore";
import Colors from "../../styles/color";
import Avatar from "../avatar";

const AddComment = ({ taskId }) => {
  const { user } = useAuth();
  const { addComment, isLoading } = useTaskStore();
  const [commentText, setCommentText] = useState("");


  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addComment(taskId, commentText.trim());
      setCommentText("");
    } catch (error) {
      alert(error?.error || "Failed to add comment");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {user.profile?.avatar ? (
          <Avatar url={user.profile.avatar} name={user?.profile?.fullName} width={36} height={36} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={!commentText.trim() || isLoading}
          style={styles.sendButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <SendIcon
              width={20}
              height={20}
              fill={commentText.trim() ? Colors.primary : "#CCC"}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddComment;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    padding: 6,
    marginLeft: 8,
  },
});