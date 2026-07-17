import { useAuth } from "@/src/contexts/authContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DownloadIcon from "../../../assets/icons/download.svg";
import EditIcon from "../../../assets/icons/edit.svg";
import TrashIcon from "../../../assets/icons/trash.svg";
import { CategoryMap, DefaultCategory } from "../../utils/categoryMapping";
import { useState } from "react";
import useTaskStore from "../../../store/taskStore";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import AddComment from "../../components/task/addComment";
import CommentList from "../../components/task/commentList";
import SubTaskList from "../../components/task/subtaskList";
import AddSubtaskInput from "../../components/task/addSubtaskInput";
import SubtaskProgress from "../../components/task/subtaskProgress";
import Colors from "../../styles/color";
import { downloadFile } from "../../utils/downloadHelper";
import { getAbsoluteFileUrl } from "../../utils/fileUrlHelper";
import Avatar from "@/src/components/avatar";

const TaskDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params;
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const { user, canManageTasks } = useAuth();
  const {
    selectedTask,
    isLoading,
    fetchTaskById,
    updateTaskStatus,
    deleteTask,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTaskStore();

  useEffect(() => {
    fetchTaskById(taskId);
  }, [taskId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchTaskById(taskId);
    } catch (err) {
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(taskId);
          navigation.goBack();
        },
      },
    ]);
  };

  // Subtask handlers
  const handleAddSubtask = async (title) => {
    setIsAddingSubtask(true);
    try {
      await createSubtask(taskId, title);
      Alert.alert("Success", "Subtask added successfully");
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to add subtask");
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtask(taskId, subtaskId);
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to toggle subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    Alert.alert(
      "Delete Subtask",
      "Are you sure you want to delete this subtask?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSubtask(taskId, subtaskId);
              Alert.alert("Success", "Subtask deleted successfully");
            } catch (error) {
              Alert.alert("Error", error?.error || "Failed to delete subtask");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (url, filename, fileId) => {
    Alert.alert(
      'Download File',
      `Do you want to download "${filename}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setDownloadingFileId(fileId);
              await downloadFile(url, filename);
              setDownloadingFileId(null);
            } catch (error) {
              console.error('Download failed:', error);
              setDownloadingFileId(null);
              Alert.alert('Download Error', 'Failed to download file. Please try again.');
            }
          },
        },
      ],
    );
  };

  const openImageViewer = (images, startIndex = 0) => {
    navigation.navigate("ImageViewer", {
      images: images.map((img) => img.url),
      initialIndex: startIndex,
    });
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusConfig = (status) => {
    const map = {
      todo: { label: "To Do", color: "#8E8E93" },
      in_progress: { label: "In Progress", color: "#007AFF" },
      done: { label: "Done", color: "#34C759" },
    };
    return map[status] || map.todo;
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    const formatted = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  
    let color = "#34C759";
    let label = formatted;
  
    if (diffDays < 0) {
      color = "#c3271fff";
      label = `Overdue (${formatted})`;
    } else if (diffDays === 0) {
      color = "#cc8219ff";
      label = `Today (${formatted})`;
    } else if (diffDays === 1) {
      color = "#fdb550ff";
      label = `Tomorrow (${formatted})`;
    } else if (diffDays <= 3) {
      color = "#39d82aff";
      label = `${diffDays} days left`;
    }
  
    return { label, color };
  };

  if (isLoading || !selectedTask) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const canManageTask = canManageTasks();
  const isAssignedToTask = selectedTask.assignedTo?.some((p) => p._id === user?._id);
  const canToggleSubtasks = isAssignedToTask || canManageTask;
  const canAddDeleteSubtasks = canManageTask;
  const statusKey = selectedTask.status === "in_progress" ? "inprogress" : selectedTask.status;
  const StatusIcon = CategoryMap[statusKey] || DefaultCategory;
  const statusConfig = getStatusConfig(selectedTask.status);

  const imageAttachments = (selectedTask.attachments || [])
    .filter((att) =>
      att.type?.includes("image") || /\.(jpe?g|png|gif|webp)$/i.test(att.url)
    )
    .map((att) => ({
      ...att,
      url: getAbsoluteFileUrl(att.url),
    }));

  const fileAttachments = (selectedTask.attachments || [])
    .filter(
      (att) => !att.type?.includes("image") && !/\.(jpe?g|png|gif|webp)$/i.test(att.url)
    )
    .map((att) => ({
      ...att,
      url: getAbsoluteFileUrl(att.url),
    }));

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton title="Task Details" onBackPress={() => navigation.goBack()} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={() => fetchTaskById(taskId)}
              tintColor={Colors.primary}
            />
          }
        >
        {/* Title & Status Badge */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.titleWrapper}>
              <Text style={styles.taskTitle}>{selectedTask.title}</Text>
              <Text style={styles.createdDate}>Created {formatDate(selectedTask.createdAt)}</Text>
            </View>
            
            {canManageTask && (
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("EditTask", { taskId })} 
                  style={styles.actionBtn}
                >
                  <EditIcon width={20} height={20} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDelete} 
                  style={styles.actionBtn}
                >
                  <TrashIcon width={20} height={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabelInline}>Status:</Text>
              <View style={[styles.infoBadge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.badgeTextSmall}>{statusConfig.label}</Text>
              </View>
            </View>

            {/* Priority */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabelInline}>Priority:</Text>
              <View style={[
                styles.infoBadge,
                {
                  backgroundColor:
                    selectedTask.priority === "high" ? "#FF3B30" :
                    selectedTask.priority === "medium" ? "#FF9500" : "#34C759"
                }
              ]}>
                <Text style={styles.badgeTextSmall}>
                  {selectedTask.priority?.charAt(0).toUpperCase() + selectedTask.priority?.slice(1) || "Medium"}
                </Text>
              </View>
            </View>

            {/* Deadline */}
            {selectedTask.dueDate && (() => {
              const deadline = formatDeadline(selectedTask.dueDate);
              return deadline ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabelInline}>Deadline:</Text>
                  <View style={[styles.infoBadge, { backgroundColor: deadline.color }]}>
                    <Text style={styles.badgeTextSmall}>{deadline.label}</Text>
                  </View>
                </View>
              ) : null;
            })()}
          </View>
        </View>

       

        {/* === HIỂN THỊ ẢNH – ĐẸP NHƯ ẢNH MẪU === */}
        {imageAttachments.length > 0 && (
          <View style={styles.section}>

            {imageAttachments.length === 1 && (
              <TouchableOpacity
                onPress={() => openImageViewer(imageAttachments)}
                style={styles.singleImageWrapper}
              >
                <Image source={{ uri: imageAttachments[0].url }} style={styles.singleImage} resizeMode="cover" />
              </TouchableOpacity>
            )}

            {imageAttachments.length === 2 && (
              <View style={styles.twoImagesRow}>
                {imageAttachments.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openImageViewer(imageAttachments, idx)}
                    style={styles.twoImageItem}
                  >
                    <Image source={{ uri: img.url }} style={styles.twoImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {imageAttachments.length >= 3 && (
              <View style={styles.threePlusLayout}>
                {/* Ảnh đầu to */}
                <TouchableOpacity
                  onPress={() => openImageViewer(imageAttachments)}
                  style={styles.mainImageWrapper}
                >
                  <Image source={{ uri: imageAttachments[0].url }} style={styles.mainImage} resizeMode="cover" />
                </TouchableOpacity>

                {/* 2 ảnh nhỏ */}
                <View style={styles.smallImagesRow}>
                  {imageAttachments.slice(1, 3).map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => openImageViewer(imageAttachments, idx + 1)}
                      style={styles.smallImageWrapper}
                    >
                      <Image source={{ uri: img.url }} style={styles.smallImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* === FILE KHÁC (PDF, DOC...) === */}
        {fileAttachments.length > 0 && (
          <View style={styles.section}>
            {fileAttachments.map((file, idx) => {
              const filename = file.name || file.url.split("/").pop().split("?")[0];
              const sizeMB = file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : null;
              
              return (
                <TouchableOpacity
                  key={file._id || idx}
                  style={styles.fileItem}
                  onPress={() => handleDownload(file.url, filename, file._id)}
                >
                  <DownloadIcon width={28} height={28} fill={Colors.primary} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.fileName} numberOfLines={2}>{filename}</Text>
                    {sizeMB && <Text style={styles.fileSize}>{sizeMB}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Description Box */}
        <View style={styles.section}>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>
              {selectedTask.description || "No description"}
            </Text>
          </View>
        </View>

        {/* Assignee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignee</Text>
          {selectedTask.assignedTo?.map((person) => (
            <View key={person._id} style={styles.assigneeItem}>
              {person.profile?.avatar ? (
                <Avatar url={person.profile.avatar} name={person._id} width={44} height={44} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {person.profile?.fullName?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.assigneeName}>{person.profile?.fullName || person.email}</Text>
                <Text style={styles.assigneeRole}>
                  {person.profile?.position|| "Employee"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subtasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
          <SubtaskProgress subtasks={selectedTask.subTasks || []} />
          <SubTaskList 
            subtasks={selectedTask.subTasks || []} 
            onSubtaskToggle={canToggleSubtasks ? handleToggleSubtask : undefined}
            onSubtaskDelete={canAddDeleteSubtasks ? handleDeleteSubtask : undefined}
            editable={canToggleSubtasks}
          />
          {canAddDeleteSubtasks && (
            <AddSubtaskInput 
              onAddSubtask={handleAddSubtask}
              isLoading={isAddingSubtask}
            />
          )}
        </View>

        {/* Status Checkbox */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          {(selectedTask.assignedTo?.some((p) => p._id === user?._id) || canManageTask) ? (
            <View style={styles.statusCheckboxContainer}>
              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => handleStatusUpdate("todo")}
              >
                <View style={[
                  styles.checkbox,
                  selectedTask.status === "todo" && styles.checkboxChecked
                ]}>
                  {selectedTask.status === "todo" && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>To Do</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => handleStatusUpdate("in_progress")}
              >
                <View style={[
                  styles.checkbox,
                  selectedTask.status === "in_progress" && styles.checkboxChecked
                ]}>
                  {selectedTask.status === "in_progress" && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>In Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => handleStatusUpdate("done")}
              >
                <View style={[
                  styles.checkbox,
                  selectedTask.status === "done" && styles.checkboxChecked
                ]}>
                  {selectedTask.status === "done" && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: Colors.primary, alignSelf: "flex-start" }]}>
              <StatusIcon width={18} height={18} fill="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
            </View>
          )}
        </View> */}

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments section</Text>
          <CommentList comments={selectedTask.comments || []} />
          <AddComment taskId={taskId} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TaskDetailScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },

  // Title section
  titleSection: {
    backgroundColor: "#FFF",
    padding: 20,
    paddingTop: 42,
    borderBottomWidth: 1,
    borderColor: "#EFEFF0",
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  createdDate: { fontSize: 13, color: "#999" },

  // Generic section
  section: {
    backgroundColor: "#FFF",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#EFEFF0",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },

  // Description box (nằm chung trong border)
  descriptionBox: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
  },

  infoRow: {
    flexDirection: "column",
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabelInline: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    width: 70,
  },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  badgeTextSmall: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // Description box (nằm chung trong border)
  description: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FAFAFA",
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },

  singleImageWrapper: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#0003",
  },
  singleImage: { width: "100%", height: 320 },

  twoImagesRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  twoImageItem: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#0002",
  },
  twoImage: { width: "100%", height: 260 },

  threePlusLayout: { marginTop: 8 },
  mainImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    elevation: 3,
  },
  mainImage: { width: "100%", height: 320 },

  smallImagesRow: { flexDirection: "row", gap: 10 },
  smallImageWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
  },
  smallImage: { width: "100%", height: 150 },

  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  fileName: { fontSize: 13, fontWeight: "600", color: "#000" },
  fileSize: { fontSize: 13, color: "#777", marginTop: 3 },
  downloadText: { color: Colors.primary, fontWeight: "600", fontSize: 14 },

  infoLabel: { fontSize: 15, fontWeight: "600", color: "#000", marginBottom: 10 },

  priorityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  difficultyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  deadlineBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  assigneeItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 8,
  },
  avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 12 },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  assigneeName: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#000",
    marginLeft: 10,
  },
  assigneeRole: { 
    fontSize: 13, 
    color: Colors.primary, 
    marginTop: 2,
    marginLeft: 10,
  },

  statusCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 12,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#333",
    marginLeft: 12,
    fontWeight: "500",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
  },
});
