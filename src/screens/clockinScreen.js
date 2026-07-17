import { useAttendanceStore } from "@/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Clock from "../../assets/icons/clock.svg";
import NoSchedules from "../../assets/icons/no_schedules.svg";
import AppButton from "../components/appButton";
import BigCard from "../components/clockin/bigCard";
import HeaderPromo from "../components/headerPromo";
import IconCardText from "../components/task/iconCardText";
import Colors from "../styles/color";

const formatWorkHours = (hours) => {
    if (typeof hours === 'number') {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} hrs`;
    }
    return hours || "00:00 hrs";
};

const formatTime = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
};

const ClockinScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);

  const { 
      todayAttendance,
      attendances,
      stats,
      fetchAttendance,
      fetchTodayAttendance,
      fetchAttendanceStats,
      clockOut,
      isLoading,
      getTodayWorkHours,
      hasNoAttendanceToday,
      isClockedInToday,
      isClockedOutToday,
      error,
      clearError,
  } = useAttendanceStore();

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchAttendance(),
        fetchTodayAttendance(),
        fetchAttendanceStats()
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, [fetchAttendance, fetchTodayAttendance, fetchAttendanceStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      clearError();
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClockOutConfirm = async () => {
    setShowClockOutModal(false);
    try {
      await clockOut();
      Alert.alert("Success", "You have successfully clocked out!");
      await loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to clock out. Please try again.");
    }
  };


  const buttonState = useMemo(() => {
    const noAttendance = hasNoAttendanceToday();
    const clockedIn = isClockedInToday();
    const clockedOut = isClockedOutToday();
    
    return {
      noAttendance,
      clockedIn,
      clockedOut
    };
  }, [todayAttendance]);

  const { noAttendance, clockedIn, clockedOut } = buttonState;
  const todayWorkHours = getTodayWorkHours();

  const getCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };
    
    return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
  };

  const monthRange = getCurrentMonthRange();

  const handleClockInButton = () => {
    if (noAttendance) {
      navigation.navigate("ClockInArea");
    } else if (clockedIn) {
      setShowClockOutModal(true);
    }
  };

  const clockinDays = attendances.map(record => {
    const isIncomplete = record.clockIn && !record.clockOut && !record.autoClockOut;
    
    return {
      id: record._id,
      day: new Date(record.date).toLocaleDateString(),
      totalHours: formatWorkHours(record.workHours),
      inOutTime: `${formatTime(record.clockIn)} - ${formatTime(record.clockOut)}`,
      status: record.status,
      isCalculated: record.isCalculated || false,
      autoClockOut: record.autoClockOut || false,
      isIncomplete: isIncomplete,
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.secondary }}>
      <HeaderPromo
        text={clockedIn ? "Finish the day!" : `Let's Clock-in`}
        subtext={clockedIn ? "Don't forget to clock-out!" : "Start your day and do not forget to clock-in!!"}
        color={Colors.primary}
      />
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Total working hours this month!
            </Text>
            <Text style={styles.headerSubtext}>{monthRange}</Text>
          </View>
          <View style={styles.body}>
            <IconCardText
              icon={<Clock width={16} height={16} />}
              text="Today"
              subtext={formatWorkHours(todayWorkHours)}
            />
            <IconCardText
              icon={<Clock width={16} height={16} />}
              text="This month"
              subtext={formatWorkHours(stats.totalWorkHours)}
            />
          </View>
          <View style={styles.bottom}>
            <AppButton
              text={
                noAttendance 
                  ? "Clock-in" 
                  : clockedIn 
                    ? "Clock-out" 
                    : "Clock-in"
              }
              onPress={handleClockInButton}
              style={{
                width: "95%",
                height: 47,
                marginTop: 16,
                backgroundColor: clockedOut 
                  ? "#CCCCCC" 
                  : clockedIn 
                    ? "#FF6B6B" 
                    : Colors.primary,
              }}
              textStyle={{ 
                fontSize: 15,
                color: clockedOut ? "#999999" : "#FFFFFF"
              }}
              disabled={clockedOut}
            />
            {clockedOut && (
              <Text style={styles.clockedOutText}>You have completed today's work</Text>
            )}
          </View>
        </View>
      </View>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading leaves...</Text>
          </View>
        )}
        {clockinDays.length > 0 ? clockinDays.map((item) => (
            <BigCard
                key={item.id}
                day={item.day}
                totalHours={item.totalHours}
                inOutTime={item.inOutTime}
                status={item.status}
                autoClockOut={item.autoClockOut}
                isIncomplete={item.isIncomplete}
            />
        )) : (
          <View style={styles.emptyState}>
                    <View style={styles.emptyBottom}>
                      <NoSchedules width={120} height={120} />
                      <Text
                        style={{
                          marginTop: 16,
                          fontSize: 16,
                          color: "black",
                          fontWeight: "bold",
                        }}
                      >
                        No attendance record to display.
                      </Text>
                      <Text
                        style={{ marginTop: 8, textAlign: "center", color: "#7b7b7bff" }}
                      >
                        Remember to clock-in and clock-out for every shift.
                      </Text>
                    </View>
                  </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showClockOutModal}
        onRequestClose={() => setShowClockOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm clockout?</Text>
            <Text style={styles.modalMessage}>
              Once you clock out, you will not be able to make changes to today's attendance. Please double-check your work hours before confirming. Are you sure you want to proceed?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowClockOutModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Let me check</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleClockOutConfirm}
              >
                <Text style={styles.modalButtonTextPrimary}>Yes, Clock out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ClockinScreen;

const styles = StyleSheet.create({
  summary: {
    marginTop: -80,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    gap: 7,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  headerSubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
  },
  body: {
    flexDirection: "row",
  },
  content: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyBottom: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  clockedOutText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'justify',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
});
