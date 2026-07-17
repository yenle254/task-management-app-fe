import { useAuth } from '@/src/contexts/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CalendarIcon from "../../../assets/icons/calendar-2.svg";
import Category from "../../../assets/icons/category.svg";
import ChevronDown from "../../../assets/icons/chevron_down.svg";
import ChevronLeft from "../../../assets/icons/chevron_left.svg";
import ChevronRight from "../../../assets/icons/chevron_right.svg";
import Difficulty from "../../../assets/icons/difficulty.svg";
import Priority from "../../../assets/icons/priority.svg";
import Upload from "../../../assets/icons/upload.svg";
import UserIcon from "../../../assets/icons/user_delegation.svg";
import { useTaskStore } from "../../../store/index";
import AppButton from "../../components/appButton";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import SubTaskList from "../../components/task/subtaskList";
import AddSubtaskInput from "../../components/task/addSubtaskInput";
import SubtaskProgress from "../../components/task/subtaskProgress";
import apiClient from "../../services/api";
import { teamService } from "../../services/index";
import Colors from "../../styles/color";
import Confirm from "../../../assets/icons/confirm.svg";
import Folder from "../../../assets/icons/folder.svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PRIORITIES = [
  { id: "high", name: "High", color: "#FF3B30" },
  { id: "medium", name: "Medium", color: "#FF9500" },
  { id: "low", name: "Low", color: "#34C759" },
];


const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CreateTaskScreen = ({ navigation }) => {
  const { user, canManageTasks } = useAuth();
  const { createTask, isLoading } = useTaskStore();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  
  const [subtasks, setSubtasks] = useState([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDate, setTempDate] = useState(null);
  const [dateField, setDateField] = useState("");

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [tempMembers, setTempMembers] = useState([]);
  const [tempPriority, setTempPriority] = useState(null);

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [tempTeam, setTempTeam] = useState(null);

  
  useEffect(() => {
    if (!canManageTasks?.()) {
      Alert.alert(
        "Permission Denied",
        "Only Team Lead and HR Manager can create tasks",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [canManageTasks]);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [selectedTeam?._id, user?.role, user?.teamId]);

  const fetchTeams = async () => {
    if (user?.role !== "hr_manager") return;
    try {
      const response = await teamService.getAllTeams({ page: 1, limit: 200 });
      setTeams(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      Alert.alert("Error", "Failed to load teams");
    }
  };

  const fetchTeamMembers = async () => {
    setLoadingMembers(true);
    try {
      let response;
      if (user?.role === "hr_manager") {
        if (!selectedTeam?._id) {
          setTeamMembers([]);
          return;
        }
        response = await teamService.getTeamMembers(selectedTeam._id);
      } else if (user?.role === "team_lead" && user?.teamId) {
        response = await teamService.getTeamMembers(user.teamId);
      }
      if (response?.data) {
        setTeamMembers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      Alert.alert("Error", "Failed to load team members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const uploadAttachments = async (files, taskId) => {
    if (!files || files.length === 0) return [];
  
    try {
      console.log('Starting file upload for', files.length, 'files');
      
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      
      files.forEach((file) => {
        const fileBlob = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        };
        formData.append('attachments', fileBlob);
        console.log('Added file to FormData:', file.name);
      });

      const uploadUrl = `http://192.168.11.190:3000/api/tasks/${taskId}/attachments/bulk`;
      console.log('Upload URL:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Upload error response:', errorData);
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorData}`);
      }

      const responseData = await uploadResponse.json();
      console.log('Upload successful:', responseData);
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Upload failed');
      }

      return responseData.data;
    } catch (error) {
      console.error('Upload attachments error:', error);
      throw error.message || 'Upload failed';
    }
  };

  const BLOCKED_EXTENSIONS = [
    'exe','scr','com','bat','cmd','ps1','vbs','vbe','js','jse','wsf','wsh',
    'msc','msp','mst','pif','application','gadget','hta','lnk','inf','reg',
    'sh','bash','zsh','ksh','csh','app','apk','deb','rpm',
    'dll','so','dylib','jar','class',
    'xlsm','xltm','xlam','pptm','potm','ppam','sldm','docm','dotm',
    'iso','img','msi','msp','msu','swf','air',
  ];
  
  const isFileBlocked = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.toLowerCase().match(/\.([0-9a-z]+)$/i)?.[1];
    return ext ? BLOCKED_EXTENSIONS.includes(ext) : false;
  };

  const handleAttachmentPress = async (index) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
  
      if (result.canceled) return;
  
      const files = result.assets || [];
      if (files.length === 0) return;
  
      const blockedFiles = [];
      const validFiles = [];
  
      for (const file of files) {
        const fileName = file.name || `file-${Date.now()}`;
        const fileSize = file.size || 0;

        if (fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            "File Too Large",
            `"${fileName}" exceeds the 10MB limit.`,
            [{ text: "OK" }]
          );
          continue;
        }

        if (isFileBlocked(fileName)) {
          blockedFiles.push(fileName);
          continue;
        }
  
        validFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          uri: file.uri,
          name: fileName,
          size: fileSize,
          mimeType: file.mimeType || 'application/octet-stream',
        });
      }
  
      if (blockedFiles.length > 0) {
        Alert.alert(
          "Restricted Files",
          `The following files were blocked for security reasons:\n• ${blockedFiles.join('\n• ')}`,
          [{ text: "OK" }]
        );
      }
  
      const newTotal = attachments.length + validFiles.length;
      if (newTotal > 3) {
        const canAdd = 3 - attachments.length;
        Alert.alert(
          "Attachment Limit Reached",
          `You can only attach up to 3 files.\nYou currently have ${attachments.length}, so only ${canAdd} more ${canAdd === 1 ? 'file is' : 'files are'} allowed.`,
          [{ text: "OK" }]
        );

        validFiles.splice(canAdd);
      }
  
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
      }
  
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert(
          "Error",
          "Unable to pick file(s). Please try again.",
          [{ text: "OK" }]
        );
        console.error(error);
      }
    }
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  const handleAddSubtask = (title) => {
    const newSubtask = {
      id: `temp-${Date.now()}`,
      title: title.trim(),
      isCompleted: false,
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const handleToggleSubtask = (subtaskId) => {
    setSubtasks(subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    ));
  };

  const handleDeleteSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  const validateTaskData = () => {
    if (!taskTitle.trim()) return { valid: false, message: 'Task title is required' };
    if (selectedMembers.length === 0) return { valid: false, message: 'At least one assignee is required' };
    if (user?.role === 'hr_manager' && !selectedTeam?._id) return { valid: false, message: 'Team is required' };
    if (!startDate) return { valid: false, message: 'Start date is required' };
    if (!dueDate) return { valid: false, message: 'Due date is required' };
    if (new Date(dueDate) < new Date(startDate)) return { valid: false, message: 'Due date cannot be earlier than start date' };
    return { valid: true };
  };

  const handleCreateTaskPress = () => {
    const validation = validateTaskData();
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.message);
      return;
    }
    setShowConfirmDialog(true);
  };

  const openCalendar = (field) => {
    const dateStr = field === "start" ? startDate : dueDate;
    let parsedDate = new Date();

    if (dateStr) {
      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(parts[1].toLowerCase()));
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && monthIndex >= 0 && !isNaN(year)) {
          parsedDate = new Date(year, monthIndex, day);
        }
      }
    }

    setTempDate(parsedDate);
    setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth()));
    setDateField(field);
    setShowCalendarModal(true);
  };

  const confirmDate = () => {
    if (tempDate && !isNaN(tempDate.getTime())) {
      const formatted = tempDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (dateField === "start") setStartDate(formatted);
      else setDueDate(formatted);
      setShowCalendarModal(false);
    }
  };

  const formatDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();

  // Kiểm tra ngày đã qua
  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));


  const renderDateSelector = (label, value, field) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={() => openCalendar(field)}>
        <View style={styles.selectorLeft}>
          <CalendarIcon width={20} height={20} />
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value || "Select date"}
          </Text>
        </View>
        <ChevronDown width={20} height={20} />
      </TouchableOpacity>
    </View>
  );


  const renderCalendarModal = () => (
    <Modal visible={showCalendarModal} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={() => setShowCalendarModal(false)}>
        <Pressable style={styles.calendarModalContent} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.modalDivider} />
          </View>

          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={prevMonth}><ChevronLeft width={24} height={24} /></TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextMonth}><ChevronRight width={24} height={24} /></TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map((day, idx) => {
              const disabled = day && isPastDate(day);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.calendarDay, !day && styles.emptyDay]}
                  onPress={() => {
                    if (day && !disabled) {
                      setTempDate(day);
                    } else if (disabled) {
                      Alert.alert('Cannot select date', 'Cannot select past dates');
                    }
                  }}
                  disabled={!day || disabled}
                >
                  {day && (
                    <View style={[
                      styles.dayCircle,
                      isSameDay(day, tempDate) && styles.selectedDay,
                      disabled && styles.disabledDay
                    ]}>
                      <Text style={[
                        styles.calendarDayText,
                        isSameDay(day, tempDate) && styles.selectedDayText,
                        disabled && styles.disabledDayText
                      ]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonClose]} onPress={() => setShowCalendarModal(false)}>
              <Text style={styles.modalButtonTextClose}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmDate}>
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );



  const handleConfirmCreateTask = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);
  
    try {
      const resolvedTeamId = user?.role === 'hr_manager' ? selectedTeam?._id : user?.teamId;
      const taskPayload = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        assignedTo: selectedMembers.map((m) => m._id),
        teamId: resolvedTeamId,
        priority: selectedPriority?.id || "medium",
        difficulty: "medium",
        attachments: [],
        startDate: startDate || null,
        dueDate: dueDate || null,
      };
  
      const createResponse = await createTask(taskPayload);
      const newTaskId = createResponse.data._id || createResponse._id;
  

      if (attachments.length > 0) {
        await uploadAttachments(attachments, newTaskId);
      }

      if (subtasks.length > 0) {
        const subtaskPromises = subtasks.map(subtask => 
          apiClient.post(`/tasks/${newTaskId}/subtasks`, { title: subtask.title })
        );
        await Promise.all(subtaskPromises);
      }
  
      setIsUploading(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Create task error:", error);
      setIsUploading(false);
      Alert.alert("Error", error?.error || error?.message || "Failed to create task");
    }
  };

  const toggleMemberSelection = (member) => {
    setTempMembers(prev => {
      const exists = prev.find(m => m._id === member._id);
      if (exists) {
        return prev.filter(m => m._id !== member._id);
      } else {
        return [...prev, member];
      }
    });
  };

  const isMemberSelected = (member, list) => {
    return list.some(m => m._id === member._id);
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
    selectedItems,
    onSelectItem,
    title,
    renderItem,
    multiSelect = false
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
            {multiSelect && selectedItems.length > 0 && (
              <Text style={styles.modalSubtitle}>
                {selectedItems.length} selected
              </Text>
            )}
            <View style={styles.modalDivider} />
          </View>

          {loadingMembers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={[
                    styles.modalItem,
                    (multiSelect
                      ? isMemberSelected(item, selectedItems)
                      : (selectedItems?._id || selectedItems?.id) === (item._id || item.id)) && styles.modalItemSelected,
                  ]}
                  onPress={() => onSelectItem(item)}
                >
                  {renderItem(item, multiSelect
                    ? isMemberSelected(item, selectedItems)
                    : (selectedItems?._id || selectedItems?.id) === (item._id || item.id))}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

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
              disabled={loadingMembers}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderConfirmDialog = () => (
    <Modal
      visible={showConfirmDialog}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmDialog(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <View style={styles.dialogIconContainer}>
            <View style={styles.dialogIcon}>
              <Text style={styles.dialogIconText}>
                <Confirm width={40} height={40} />
              </Text>
            </View>
          </View>

          <Text style={styles.dialogTitle}>Create New Task</Text>
          <Text style={styles.dialogMessage}>
            Double-check your task details to ensure everything is correct. Do you want to proceed?
          </Text>

          <TouchableOpacity
            style={styles.dialogButtonPrimary}
            onPress={handleConfirmCreateTask}
            disabled={isLoading}
          >
            <Text style={styles.dialogButtonPrimaryText}>
              {isLoading ? "Creating..." : "Yes, Proceed Now"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dialogButtonSecondary}
            onPress={() => setShowConfirmDialog(false)}
            disabled={isLoading}
          >
            <Text style={styles.dialogButtonSecondaryText}>No, let me check</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSuccessDialog = () => (
    <Modal
      visible={showSuccessDialog}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowSuccessDialog(false);
        navigation.goBack();
      }}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <View style={styles.dialogIconContainer}>
            <View style={styles.dialogIcon}>
              <Text style={styles.dialogIconText}>
                <Confirm width={40} height={40} />
              </Text>
            </View>
          </View>

          <Text style={styles.dialogTitle}>Task has been created!</Text>
          <Text style={styles.dialogMessage}>
            Congratulations! Task has been created! view your task in the task management
          </Text>

          <TouchableOpacity
            style={styles.dialogButtonPrimary}
            onPress={() => {
              setShowSuccessDialog(false);
              navigation.goBack();
            }}
          >
            <Text style={styles.dialogButtonPrimaryText}>View task management</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading || isUploading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Create New Task"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Creating task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
              <Text style={styles.selectorLabel}>Attachment ({attachments.length}/3)</Text>
              <Text style={styles.selectorHint}>
                Format should be in .pdf .jpeg .png and less than 10MB
              </Text>
              <View style={styles.attachmentRow}>
                {[0, 1, 2].map((index) => {
                  const attachment = attachments[index];
                  return (
                    <View key={index} style={styles.attachmentContainer}>
                      <TouchableOpacity
                        style={styles.attachmentBox}
                        onPress={() => handleAttachmentPress(index)}
                        disabled={attachment !== undefined}
                      >
                        {attachment ? (
                          <View style={styles.attachmentContent}>
                            <Folder width={24} height={24} fill={Colors.primary} />
                            <View style={styles.attachmentTextContainer}>
                              <Text style={styles.attachmentName} numberOfLines={1}>
                                {attachment.name}
                              </Text>
                              <Text style={styles.attachmentSize}>
                                {formatFileSize(attachment.size)}
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Upload width={20} height={20} />
                        )}
                      </TouchableOpacity>
                      {attachment && (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeAttachment(attachment.id)}
                        >
                          <Text style={styles.removeText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Task Title */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>Task title</Text>
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
              <Text style={styles.selectorLabel}>Task description</Text>
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

            {renderDateSelector("Start Date", startDate, "start")}
            {renderDateSelector("Due Date", dueDate, "due")}

            {/* Team (HR only) */}
            {user?.role === "hr_manager" &&
              renderSelector(
                "Team",
                selectedTeam?.name,
                "Select team",
                () => {
                  setTempTeam(selectedTeam);
                  setShowTeamModal(true);
                },
                Category
              )}

            {/* Assign To */}
            {renderSelector(
              "Assign to",
              selectedMembers.length > 0
                ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                : null,
              "Select members",
              () => {
                if (user?.role === "hr_manager" && !selectedTeam?._id) {
                  Alert.alert("Validation Error", "Please select a team first");
                  return;
                }
                setTempMembers(selectedMembers);
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

            {/* Subtasks Section */}
            <View style={styles.selectorContainer}>
              <View style={styles.subtaskHeader}>
                <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={20} color={Colors.primary} />
                <Text style={styles.selectorLabel}>Subtasks (Optional)</Text>
              </View>
              <Text style={styles.selectorHint}>
                Break down your task into smaller steps
              </Text>
              
              {subtasks.length > 0 && (
                <SubtaskProgress subtasks={subtasks} showLabel={true} />
              )}

              <SubTaskList 
                subtasks={subtasks}
                onSubtaskToggle={handleToggleSubtask}
                onSubtaskDelete={handleDeleteSubtask}
                editable={true}
              />
              
              {canManageTasks && (
                <AddSubtaskInput 
                  onAddSubtask={handleAddSubtask}
                  isLoading={false}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitButtonContainer}>
        <AppButton
          text="Create Task"
          onPress={handleCreateTaskPress}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
          disabled={isLoading}
        />
      </View>

      {/* Member Modal */}
      {renderBottomModal(
        showMemberModal,
        () => setShowMemberModal(false),
        () => {
          setSelectedMembers(tempMembers);
          setShowMemberModal(false);
        },
        teamMembers,
        tempMembers,
        toggleMemberSelection,
        "Select Members",
        (item, isSelected) => (
          <View style={styles.modalItemContent}>
            <View>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.profile?.fullName || item.email}
              </Text>
              <Text style={styles.itemSubtext}>
                {item.profile.position || "Employee"} • {item.profile.department || 'No department'}
              </Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        ),
        true
      )}

      {/* Team Modal (HR only) */}
      {renderBottomModal(
        showTeamModal,
        () => setShowTeamModal(false),
        () => {
          setSelectedTeam(tempTeam);
          setSelectedMembers([]);
          setTempMembers([]);
          setShowTeamModal(false);
        },
        teams,
        tempTeam,
        setTempTeam,
        "Select Team",
        (item, isSelected) => (
          <View style={styles.modalItemContent}>
            <View>
              <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                {item.name}
              </Text>
              <Text style={styles.itemSubtext}>{item.description || ""}</Text>
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
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
        PRIORITIES,
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
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </View>
        )
      )}

      {renderCalendarModal()} 
      {renderConfirmDialog()}
      {renderSuccessDialog()}
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
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
  subtaskHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "space-between",
  },
  attachmentContainer: {
    flex: 1,
    position: "relative",
  },
  attachmentBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    backgroundColor: "#F4F3FF",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  attachmentContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
  },
  attachmentTextContainer: {
    alignItems: "center",
    gap: 2,
  },
  attachmentName: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "500",
    textAlign: "center",
    marginHorizontal: 4,
  },
  attachmentSize: {
    fontSize: 10,
    color: "#999999",
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
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
  },
  textInputDescription: {
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
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  modalSubtitle: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "bold",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  // NEW: Dialog Styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIconContainer: {
    marginBottom: 20,
    marginTop: -50,
  },
  dialogIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogIconText: {
    fontSize: 40,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogButtonPrimary: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dialogButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dialogButtonSecondary: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  dialogButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  monthText: { fontSize: 18, fontWeight: '600', color: '#000000' },
  weekDays: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12 },
  weekDayText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#666666' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingBottom: 20 },
  calendarDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  emptyDay: { backgroundColor: 'transparent' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  selectedDay: { backgroundColor: Colors.primary },
  disabledDay: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  calendarDayText: { fontSize: 15, color: '#000000', fontWeight: '500' },
  selectedDayText: { color: '#FFFFFF', fontWeight: '700' },
  disabledDayText: {
    color: '#CCCCCC',
    textDecorationLine: 'line-through',
  },
  calendarModalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
});