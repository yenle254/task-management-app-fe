import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, } from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../styles/color";
import HeaderWithBackButton from "../components/headerWithBackButton";
import AppButton from "../components/appButton";
import ChevronDown from "../../assets/icons/chevron_down.svg";
import ChevronLeft from "../../assets/icons/chevron_left.svg";
import ChevronRight from "../../assets/icons/chevron_right.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import Category from "../../assets/icons/category.svg";
import Calendar from "../../assets/icons/calendar-2.svg";
import Delegation from "../../assets/icons/user_delegation.svg";
import { leaveService } from "../services";
import { useLeaveStore } from "../../store";

const mockLeaveCategories = [
  { id: 1, name: "Vacation Leave", value: "vacation", days: 12 },
  { id: 2, name: "Sick Leave", value: "sick", days: 12 },
  { id: 3, name: "Personal Leave", value: "personal", days: 12 },
];

const SubmitLeaveScreen = ({ navigation }) => {
  const { leaves, fetchLeaves } = useLeaveStore();
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDelegate, setSelectedDelegate] = useState(null);
  const [selectedDates, setSelectedDates] = useState({
    start: null,
    end: null,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCountryCodeModal, setShowCountryCodeModal] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date) => {
    if (!date) return "";
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isDateInRange = (date, start, end) => {
    if (!date || !start || !end) return false;
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
  };


  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isDateTaken = (date) => {
    if (!date) return false;
    
    return leaves.some(leave => {
      if (leave.status !== 'pending' && leave.status !== 'approved') {
        return false;
      }
      
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const checkDate = new Date(date);
      
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= leaveStart && checkDate <= leaveEnd;
    });
  };

  const isDateDisabled = (date) => {
    return isPastDate(date) || isDateTaken(date);
  };

  const isAnyDateInRangeTaken = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      if (isDateTaken(currentDate)) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return false;
  };

  const handleDatePress = (date) => {
    if (isDateDisabled(date)) {
      Alert.alert(
        'Cannot select date',
        isPastDate(date) 
          ? 'Cannot select past dates' 
          : 'This date already has a leave request'
      );
      return;
    }

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      let newStartDate, newEndDate;
      if (date >= tempStartDate) {
        newStartDate = tempStartDate;
        newEndDate = date;
      } else {
        newStartDate = date;
        newEndDate = tempStartDate;
      }
      
      if (isAnyDateInRangeTaken(newStartDate, newEndDate)) {
        Alert.alert(
          'Cannot select date range',
          'The selected date range contains dates that already have leave requests. Please select consecutive available dates only.'
        );
        return;
      }

      setTempStartDate(newStartDate);
      setTempEndDate(newEndDate);
    }
  };

  const handleConfirmDates = () => {
    if (tempStartDate && tempEndDate) {
      setSelectedDates({ start: tempStartDate, end: tempEndDate });
      setShowCalendarModal(false);
      setTempStartDate(null);
      setTempEndDate(null);
    }
  };

  const handleCloseCalendar = () => {
    setShowCalendarModal(false);
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
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

  const renderCalendarModal = () => (
    <Modal
      visible={showCalendarModal}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseCalendar}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCloseCalendar}>
        <Pressable
          style={styles.calendarModalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Leave Duration</Text>
            <View style={styles.modalDivider} />
          </View>

          <View style={styles.calendarHeader}>
            <Calendar width={20} height={20} />
            <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
              <ChevronLeft width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <ChevronRight width={24} height={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map((date, index) => {
              const isStart = date && isSameDay(date, tempStartDate);
              const isEnd = date && isSameDay(date, tempEndDate);
              const inRange =
                date &&
                tempStartDate &&
                tempEndDate &&
                isDateInRange(date, tempStartDate, tempEndDate);
              const disabled = date && isDateDisabled(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !date && styles.emptyDay,
                    (isStart || isEnd) && styles.selectedDay,
                    inRange && !isStart && !isEnd && styles.rangeDay,
                    disabled && styles.disabledDay,
                  ]}
                  onPress={() => date && handleDatePress(date)}
                  disabled={!date || disabled}
                >
                  {date && (
                    <Text
                      style={[
                        styles.calendarDayText,
                        (isStart || isEnd) && styles.selectedDayText,
                        disabled && styles.disabledDayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {tempStartDate && (
            <View style={styles.selectedDatesInfo}>
              <Text style={styles.selectedDatesText}>
                {formatDate(tempStartDate)}
                {tempEndDate && ` - ${formatDate(tempEndDate)}`}
              </Text>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={handleCloseCalendar}
            >
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                (!tempStartDate || !tempEndDate) && styles.modalButtonDisabled,
              ]}
              onPress={handleConfirmDates}
              disabled={!tempStartDate || !tempEndDate}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const [tempCategory, setTempCategory] = useState(null);
  // const [tempDelegate, setTempDelegate] = useState(null);
  // const [selectedCountryCode, setSelectedCountryCode] = useState(mockCountryCodes[0]);
  // const [tempCountryCode, setTempCountryCode] = useState(null);
  // const [emergencyContact, setEmergencyContact] = useState("");
  const [leaveDescription, setLeaveDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitLeave = async () => {
    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a leave category');
      return;
    }

    if (!selectedDates.start || !selectedDates.end) {
      Alert.alert('Validation Error', 'Please select leave duration');
      return;
    }

    if (!leaveDescription.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for your leave');
      return;
    }

    try {
      setIsSubmitting(true);

      const leaveData = {
        type: selectedCategory.value,
        startDate: selectedDates.start.toISOString(),
        endDate: selectedDates.end.toISOString(),
        reason: leaveDescription.trim(),
      };

      const response = await leaveService.submitLeave(leaveData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your leave request has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Submit leave error:', error);
      Alert.alert(
        'Error',
        error.error || 'Failed to submit leave request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Submit Leave"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            {renderSelector(
              "Leave Category",
              selectedCategory?.name,
              "Select leave category",
              () => {
                setTempCategory(selectedCategory);
                setShowCategoryModal(true);
              },
              Category
            )}

            {renderSelector(
              "Leave Duration",
              selectedDates.start && selectedDates.end
                ? `${formatDate(selectedDates.start)} - ${formatDate(
                    selectedDates.end
                  )}`
                : null,
              "Select leave duration",
              () => {
                setTempStartDate(selectedDates.start);
                setTempEndDate(selectedDates.end);
                setShowCalendarModal(true);
              },
              Calendar
            )}

            {/* {renderSelector(
              "Task Delegation",
              selectedDelegate?.name,
              "Select task delegate",
              () => {
                setTempDelegate(selectedDelegate);
                setShowDelegateModal(true);
              },
              Delegation
            )}

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>
                Emergency Contact
              </Text>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity 
                  style={styles.countryCodeButton}
                  onPress={() => {
                    setTempCountryCode(selectedCountryCode);
                    setShowCountryCodeModal(true);
                  }}
                >
                  <Text style={styles.countryCodeFlag}>{selectedCountryCode.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountryCode.code}</Text>
                  <ChevronDown width={16} height={16} />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+ 84 382990020"
                  placeholderTextColor="#999999ae"
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  keyboardType="phone-pad"
                />
              </View>
            </View> */}

            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>
                Leave Description
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Enter reason for leave..."
                placeholderTextColor="#999999ae"
                value={leaveDescription}
                onChangeText={setLeaveDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                height={140}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text={isSubmitting ? "Submitting..." : "Submit Request"}
          onPress={handleSubmitLeave}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          textStyle={styles.submitButtonText}
          disabled={isSubmitting}
        />
        {isSubmitting && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.loadingIndicator}
          />
        )}
      </View>

      {renderBottomModal(
        showCategoryModal,
        () => setShowCategoryModal(false),
        () => {
          setSelectedCategory(tempCategory);
          setShowCategoryModal(false);
        },
        mockLeaveCategories,
        tempCategory,
        setTempCategory,
        "Select Leave Category",
        (item, isSelected) => (
          <View style={styles.categoryItemContent}>
            <View>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.name}
              </Text>
              <Text style={styles.itemSubtext}>{item.days} days available</Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )}

      {/* Task Delegation Modal
      {renderBottomModal(
        showDelegateModal,
        () => setShowDelegateModal(false),
        () => {
          setSelectedDelegate(tempDelegate);
          setShowDelegateModal(false);
        },
        mockTaskDelegation,
        tempDelegate,
        setTempDelegate,
        "Select Task Delegate",
        (item, isSelected) => (
          <View style={styles.categoryItemContent}>
            <View>
              <Text
                style={[styles.itemName, isSelected && styles.itemNameSelected]}
              >
                {item.name}
              </Text>
              <Text style={styles.itemSubtext}>{item.position}</Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )} */}

      {renderCalendarModal()}

      {/* {renderBottomModal(
        showCountryCodeModal,
        () => setShowCountryCodeModal(false),
        () => {
          setSelectedCountryCode(tempCountryCode);
          setShowCountryCodeModal(false);
        },
        mockCountryCodes,
        tempCountryCode,
        setTempCountryCode,
        "Select Country Code",
        (item, isSelected) => (
          <View style={styles.categoryItemContent}>
            <View style={styles.countryCodeItem}>
              <Text style={styles.countryCodeFlag}>{item.flag}</Text>
              <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                {item.country}
              </Text>
              <Text style={styles.itemSubtext}>{item.code}</Text>
            </View>
            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        )
      )} */}
    </SafeAreaView>
  );
};

export default SubmitLeaveScreen;

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
    paddingBottom: 32,
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
  textInput: {
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
    minHeight: 100,
    paddingTop: 16,
  },
  phoneInputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  countryCodeButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  countryCodeFlag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
  },
  phoneInput: {
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
  countryCodeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  submitButtonContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIndicator: {
    position: "absolute",
    right: 40,
    top: "50%",
    marginTop: -10,
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
  calendarModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
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
  categoryItemContent: {
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
  modalButtonDisabled: {
    backgroundColor: "#CCCCCC",
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
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  weekDays: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  rangeDay: {
    backgroundColor: "#E8E0FF",
    borderRadius: 0,
  },
  calendarDayText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  disabledDay: {
    backgroundColor: "#F5F5F5",
    opacity: 0.5,
  },
  disabledDayText: {
    color: "#CCCCCC",
    textDecorationLine: "line-through",
  },
  selectedDatesInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F4F3FF",
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedDatesText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
  },
});
