import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../styles/color";

const AddSubtaskInput = ({ onAddSubtask, isLoading = false }) => {
    const [subtaskTitle, setSubtaskTitle] = useState("");

    const handleAddSubtask = async () => {
        if (!subtaskTitle.trim()) return;

        try {
            await onAddSubtask(subtaskTitle.trim());
            setSubtaskTitle("");
        } catch (error) {
            console.error("Error adding subtask:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <MaterialCommunityIcons 
                    name="checkbox-blank-outline" 
                    size={24} 
                    color="#999" 
                    style={styles.icon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Add a subtask..."
                    placeholderTextColor="#999"
                    value={subtaskTitle}
                    onChangeText={setSubtaskTitle}
                    onSubmitEditing={handleAddSubtask}
                    returnKeyType="done"
                    editable={!isLoading}
                />
                <TouchableOpacity 
                    style={[
                        styles.addButton,
                        (!subtaskTitle.trim() || isLoading) && styles.addButtonDisabled
                    ]}
                    onPress={handleAddSubtask}
                    disabled={!subtaskTitle.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AddSubtaskInput;

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ECECEC",
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#333",
        paddingVertical: 12,
        fontWeight: "500",
    },
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    addButtonDisabled: {
        backgroundColor: "#CCC",
        opacity: 0.5,
    },
});


