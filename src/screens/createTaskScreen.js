import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Category from "../../assets/icons/category.svg";
import ChevronDown from "../../assets/icons/chevron_down.svg";
import Difficulty from "../../assets/icons/difficulty.svg";
import Priority from "../../assets/icons/priority.svg";
import Upload from "../../assets/icons/upload.svg";
import UserIcon from "../../assets/icons/user_delegation.svg";
import AppButton from "../components/appButton";
import HeaderWithBackButton from "../components/headerWithBackButton";
import Colors from "../styles/color";

const mockMembers = [
  { id: 1, name: "John Doe", role: "Developer" },
  { id: 2, name: "Jane Smith", role: "Designer" },
  { id: 3, name: "Mike Johnson", role: "Manager" },
  { id: 4, name: "Sarah Williams", role: "QA Tester" },
  { id: 5, name: "Tom Brown", role: "Product Owner" },
];

const mockPriorities = [
  { id: 1, name: "High", color: "#FF3B30" },
  { id: 2, name: "Medium", color: "#FF9500" },
  { id: 3, name: "Low", color: "#34C759" },
];

const mockDifficulties = [
  { id: 1, name: "Easy", level: "⭐" },
  { id: 2, name: "Medium", level: "⭐⭐" },
  { id: 3, name: "Hard", level: "⭐⭐⭐" },
  { id: 4, name: "Very Hard", level: "⭐⭐⭐⭐" },
];

const CreateTaskScreen = ({ navigation }) => {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [attachments, setAttachments] = useState([null, null, null]);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  const [tempMember, setTempMember] = useState(null);
  const [tempPriority, setTempPriority] = useState(null);
  const [tempDifficulty, setTempDifficulty] = useState(null);

  const handleAttachmentPress = (index) => {
    console.log(`Upload attachment ${index + 1}`);

  };

  const handleCreateTask = () => {
    console.log({
      taskTitle,
      taskDescription,
      member: selectedMember,
      priority: selectedPriority,
      difficulty: selectedDifficulty,
      attachments,
    });
    navigation.goBack();
  };

  const renderSelector = (label, value, placeholder, onPress, Icon) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onPress}>
        <View style={styles.selectorLeft}>
          <Icon width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </TouchableOpacity>
    </View>
  );

  const renderBottomModal = (
    visible,
    onClose,
    onConfirm,
    items,
    selectedItem,
    onSelectItem,
    title,
    renderItem
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.modalDivider} />
          </View>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.modalItem,
                  selectedItem?.id === item.id && styles.modalItemSelected,
                ]}
                onPress={() => onSelectItem(item)}
              >
                {renderItem(item, selectedItem?.id === item.id)}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Create New Task"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Attachment</Text>
              <Text style={styles.selectorHint}>
                Format should be in .pdf .jpeg .png and less than 5MB
              </Text>
              <View style={styles.attachmentRow}>
                {attachments.map((attachment, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentBox}
                    onPress={() => handleAttachmentPress(index)}
                  >
                    <Upload width={20} height={20} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Task Title</Text>
              <View style={styles.inputWrapper}>
                <Category width={20} height={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter task title"
                  placeholderTextColor="#999999ae"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />
              </View>
            </View>

            {/* Task Description */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Task Description</Text>
              <TextInput
                style={[styles.textInputDescription, styles.textInputMultiline]}
                placeholder="Enter task description"
                placeholderTextColor="#999999ae"
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Assign To */}
            {renderSelector(
              "Assign to",
              selectedMember?.name,
              "Select member",
              () => {
                setTempMember(selectedMember);
                setShowMemberModal(true);
              },
              UserIcon
            )}

            {/* Priority */}
            {renderSelector(
              "Priority",
              selectedPriority?.name,
              "Select priority",
              () => {
                setTempPriority(selectedPriority);
                setShowPriorityModal(true);
              },
              Priority
            )}

            {/* Difficulty */}
            {renderSelector(
              "Difficulty",
              selectedDifficulty?.name,
              "Select difficulty",
              () => {
                setTempDifficulty(selectedDifficulty);
                setShowDifficultyModal(true);
              },
              Difficulty
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text="Create Task"
          onPress={handleCreateTask}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </View>

      {/* Member Modal */}
      {renderBottomModal(
        showMemberModal,
        () => setShowMemberModal(false),
        () => {
          setSelectedMember(tempMember);
          setShowMemberModal(false);
        },
        mockMembers,
        tempMember,
        setTempMember,
        "Select Member",
        (item, isSelected) => (
          <View style={styles.modalItemContent}>
            <View>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.name}
              </Text>
              <Text style={styles.itemSubtext}>{item.role}</Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}

      {/* Priority Modal */}
      {renderBottomModal(
        showPriorityModal,
        () => setShowPriorityModal(false),
        () => {
          setSelectedPriority(tempPriority);
          setShowPriorityModal(false);
        },
        mockPriorities,
        tempPriority,
        setTempPriority,
        "Select Priority",
        (item, isSelected) => (
          <View style={styles.modalItemContent}>
            <View style={styles.priorityRow}>
              <View
                style={[styles.priorityDot, { backgroundColor: item.color }]}
              />
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.name}
              </Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}

      {/* Difficulty Modal */}
      {renderBottomModal(
        showDifficultyModal,
        () => setShowDifficultyModal(false),
        () => {
          setSelectedDifficulty(tempDifficulty);
          setShowDifficultyModal(false);
        },
        mockDifficulties,
        tempDifficulty,
        setTempDifficulty,
        "Select Difficulty",
        (item, isSelected) => (
          <View style={styles.modalItemContent}>
            <View style={styles.difficultyRow}>
              <Text style={styles.difficultyLevel}>{item.level}</Text>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.name}
              </Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}
    </SafeAreaView>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollViewContent: {
    padding: 16,
  },
  contentWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  content: {
    gap: 20,
  },
  selectorContainer: {
    gap: 8,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  selectorHint: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  selector: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectorText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
    flex: 1,
  },
  placeholderText: {
    color: "#999999",
    fontWeight: "400",
  },
  attachmentRow: {
    flexDirection: "row",
    gap: 12,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  attachmentBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 0.8,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    backgroundColor: "#F4F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
    // borderWidth: 1,
    // borderColor: "#E8E8E8",
  },
  textInputDescription: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  textInputMultiline: {
    minHeight: 120,
    paddingTop: 16,
  },
  submitButtonContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingTop: 16,
    borderTopColor: "#E8E8E8",
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginTop: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  modalItemSelected: {
    backgroundColor: "#F4F3FF",
  },
  modalItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 4,
  },
  itemNameSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  itemSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonClose: {
    backgroundColor: "#F5F5F5",
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextClose: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  difficultyLevel: {
    fontSize: 16,
  },
});

