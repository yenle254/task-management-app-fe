import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../styles/color";

const SubTaskList = ({ subtasks = [], onSubtaskToggle, onSubtaskDelete, editable = true }) => {
    if (!subtasks || subtasks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="checkbox-multiple-blank-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No subtasks yet</Text>
                <Text style={styles.emptySubtext}>Add subtasks to break down this task</Text>
            </View>
        );
    }

    const handleToggleSubtask = (subtask) => {
        if (onSubtaskToggle) {
            const subtaskId = subtask._id || subtask.id;
            onSubtaskToggle(subtaskId, !subtask.isCompleted);
        }
    };

    const handleDeleteSubtask = (subtask) => {
        if (onSubtaskDelete) {
            const subtaskId = subtask._id || subtask.id;
            onSubtaskDelete(subtaskId);
        }
    };

    return (
        <View style={styles.container}>
            {subtasks.map((subtask) => (
                <View key={subtask._id || subtask.id} style={styles.subtaskItem}>
                    <TouchableOpacity 
                        style={styles.checkboxContainer}
                        onPress={() => handleToggleSubtask(subtask)}
                        disabled={!editable}
                    >
                        <MaterialCommunityIcons
                            name={subtask.isCompleted ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={24}
                            color={subtask.isCompleted ? Colors.primary : "#999"}
                        />
                    </TouchableOpacity>
                    <Text style={[
                        styles.subtaskText,
                        subtask.isCompleted && styles.completedText
                    ]}>
                        {subtask.title}
                    </Text>
                    {editable && onSubtaskDelete && (
                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDeleteSubtask(subtask)}
                        >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </View>
    );
}

export default SubTaskList;

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        marginTop: 4,
        textAlign: "center",
    },
    subtaskItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#FAFAFA",
        borderWidth: 1,
        borderColor: "#ECECEC",
    },
    checkboxContainer: {
        marginRight: 12,
        padding: 2,
    },
    subtaskText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#333",
        flex: 1,
    },
    completedText: {
        fontWeight: "400",
        color: "#999",
        textDecorationLine: "line-through",
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
});
