import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../styles/color";

const SubtaskProgress = ({ subtasks = [], showLabel = true }) => {
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(st => st.isCompleted).length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    if (totalSubtasks === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {showLabel && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>
                        Subtasks Progress
                    </Text>
                    <Text style={styles.progressText}>
                        {completedSubtasks}/{totalSubtasks} completed ({Math.round(progress)}%)
                    </Text>
                </View>
            )}
            <View style={styles.progressBarContainer}>
                <View 
                    style={[
                        styles.progressBar, 
                        { width: `${progress}%` },
                        progress === 100 && styles.progressBarComplete
                    ]} 
                />
            </View>
        </View>
    );
};

export default SubtaskProgress;

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    labelContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    progressText: {
        fontSize: 13,
        fontWeight: "500",
        color: Colors.primary,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: "#ECECEC",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: Colors.primary,
        borderRadius: 4,
        transition: "width 0.3s ease",
    },
    progressBarComplete: {
        backgroundColor: "#34C759",
    },
});


