import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, ActivityIndicator, Pressable, Modal, TextInput, } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import HeaderPromo from "../../components/headerPromo";
import Colors from "../../styles/color";
import AppButton from "../../components/appButton";
import NoLeave from "../../../assets/icons/no_leave.svg";
import Avatar from "../../components/avatar";
import IconCardText from "@/src/components/task/iconCardText";
import { useLeaveStore } from "../../../store";
import { useAuth } from "../../contexts/authContext";
import apiClient from "../../services/api";

const PendingLeavesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [teams, setTeams] = useState(["all", "Team A", "Team B", "Team C"]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState(null);
  const [allLeaves, setAllLeaves] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const {
    pendingLeaves,
    isLoading,
    error,
    fetchPendingLeaves,
    approveLeave,
    rejectLeave,
    clearError,
  } = useLeaveStore();

  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      clearError();
    }
  }, [error]);

  const loadData = async () => {
    try {
      await fetchPendingLeaves();
      try {
        const response = await apiClient.get('/leaves/statistics');
        
        if (response?.success) {
          const stats = response?.stats || { pending: 0, approved: 0, rejected: 0 };
          const leaves = response?.data || [];
          setAllLeaves(leaves);
          setLeaveStats(stats);
        } else {
        }
      } catch (err) {
        if (err.response?.status === 403) {
          console.warn('User may not have proper role for statistics endpoint');
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredLeaves = useMemo(() => {
    if (selectedTeam === "all") {
      return pendingLeaves;
    }
    return pendingLeaves;
  }, [pendingLeaves, selectedTeam]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
    setRejectionReason("");
    setActionType(null);
  };

  const handleApproveClick = () => {
    setActionType("approve");
  };

  const handleRejectClick = () => {
    setActionType("reject");
  };

  const handleConfirmApprove = async () => {
    if (!selectedLeave) return;
    
    try {
      await approveLeave(selectedLeave._id);
      Alert.alert("Success", "Leave request has been approved!");
      setModalVisible(false);
      setSelectedLeave(null);
      setActionType(null);
      await loadData();
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to approve leave request");
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedLeave) return;
    
    if (!rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection");
      return;
    }
    
    try {
      await rejectLeave(selectedLeave._id, rejectionReason);
      Alert.alert("Success", "Leave request has been rejected!");
      setModalVisible(false);
      setSelectedLeave(null);
      setRejectionReason("");
      setActionType(null);
      await loadData();
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to reject leave request");
    }
  };

  const handleCancelAction = () => {
    setActionType(null);
    setRejectionReason("");
  };

  const handleQuickApprove = async (leaveId) => {
    Alert.alert(
      "Confirm Approval",
      "Are you sure you want to approve this leave request?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveLeave(leaveId);
              Alert.alert("Success", "Leave request has been approved!");
              await loadData();
            } catch (error) {
              Alert.alert("Error", error?.error || "Failed to approve leave request");
            }
          }
        }
      ]
    );
  };

  const handleQuickReject = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
    setActionType("reject");
    setRejectionReason("");
  };

  const renderLeaveCard = (item) => {
    const startDateFormatted = formatDate(item.startDate);
    const endDateFormatted = formatDate(item.endDate);
    const employeeName = item.userId?.profile?.fullName || item.userId?.email || "Unknown Employee";
    const employeeAvatar = item.userId?.profile?.avatar || null;
    return (
      <Pressable
        key={item._id}
        style={styles.leaveCard}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.employeeSection}>
          <Avatar 
            url={employeeAvatar}
            name={employeeName}
            width={48}
            height={48}
          />
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.employeeEmail}>
              {item.userId?.email || "No email"}
            </Text>
          </View>
        </View>

        <View style={styles.leaveDetails}>
          <View style={styles.leaveHeader}>
            <Text style={styles.leaveType}>
              {item.type?.toUpperCase() || "LEAVE"}
            </Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
          </View>

          <View style={styles.leaveRow}>
            <Text style={styles.leaveLabel}>Leave date</Text>
            <Text style={styles.leaveLabel}>Total leave</Text>
          </View>
          <View style={styles.leaveRow}>
            <Text style={styles.leaveValue}>
              {startDateFormatted} - {endDateFormatted}
            </Text>
            <Text style={styles.leaveValue}>
              {item.numberOfDays} {item.numberOfDays > 1 ? "Days" : "Day"}
            </Text>
          </View>

          {item.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleQuickApprove(item._id);
            }}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleQuickReject(item);
            }}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.secondary }}>
      <HeaderPromo
        text="Pending Leaves"
        subtext="Review and approve leave requests"
        color={Colors.primary}
      />

      {/* Statistics Summary */}
      <View style={styles.summary}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Leaves statistics</Text>
          <Text style={styles.headerSubtext}>
            Total leave requests overview
          </Text>
        </View>
        <View style={styles.body}>
          <IconCardText
            icon={<View style={styles.pendingDot} />}
            text={"Pending"}
            subtext={leaveStats.pending}
            textStyle={{
              fontSize: 13,
            }}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          />
          <IconCardText
            icon={<View style={styles.approvedDot} />}
            text={"Approved"}
            subtext={leaveStats.approved}
            textStyle={{
              fontSize: 13,
            }}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          />
          <IconCardText
            icon={<View style={styles.rejectedDot} />}
            text={"Rejected"}
            textStyle={{
              fontSize: 13,
            }}
            subtext={leaveStats.rejected}
            subtextStyle={{
              fontSize: 16,
              fontWeight: "bold",
            }}
          />
        </View>
      </View>

      {/* <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {teams.map((team) => (
            <TouchableOpacity
              key={team}
              style={[
                styles.filterTab,
                selectedTeam === team && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedTeam(team)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedTeam === team && styles.activeFilterTabText,
                ]}
              >
                {team === "all" ? "All Teams" : team}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading pending leaves...</Text>
          </View>
        ) : filteredLeaves.length > 0 ? (
          <View style={styles.contentContainer}>
            {filteredLeaves.map((item) => renderLeaveCard(item))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyTop}>
              <Text style={styles.emptyTitle}>No Pending Leaves</Text>
              <Text style={styles.emptySubtitle}>
                There are no pending leave requests at the moment.
              </Text>
            </View>

            <View style={styles.emptyBottom}>
              <NoLeave width={120} height={120} />
              <Text style={styles.emptyMessage}>
                No leave requests to review.
              </Text>
              <Text style={styles.emptyDescription}>
                All leave requests have been processed or there are no new requests.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedLeave(null);
          setRejectionReason("");
          setActionType(null);
        }}
      >
        <View style={styles.modalContainer}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalContent}>
              {selectedLeave && (
                <>
                  <Text style={styles.modalTitle}>Leave Request Details</Text>
                  
                  <View style={styles.modalEmployeeSection}>
                    <Avatar 
                      url={selectedLeave.userId?.profile?.avatar || null}
                      name={selectedLeave.userId?.profile?.fullName|| selectedLeave.userId?.email || "Unknown"} 
                      width={56} 
                      height={56} 
                    />
                    <View style={styles.modalEmployeeInfo}>
                      <Text style={styles.modalEmployeeName}>
                        {selectedLeave.userId?.name || selectedLeave.userId?.email || "Unknown Employee"}
                      </Text>
                      <Text style={styles.modalEmployeeEmail}>
                        {selectedLeave.userId?.email || "No email"}
                      </Text>
                    </View>
                  </View>

                  {/* Leave Details */}
                  <View style={styles.modalLeaveRow}>
                    <Text style={styles.modalLabel}>Leave Type</Text>
                    <Text style={styles.modalValue}>
                      {selectedLeave.type?.charAt(0).toUpperCase() + selectedLeave.type?.slice(1) || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalLeaveRow}>
                    <Text style={styles.modalLabel}>Date Range</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                    </Text>
                  </View>

                  <View style={styles.modalLeaveRow}>
                    <Text style={styles.modalLabel}>Total Days</Text>
                    <Text style={styles.modalValue}>
                      {selectedLeave.numberOfDays} {selectedLeave.numberOfDays > 1 ? "Days" : "Day"}
                    </Text>
                  </View>

                  {selectedLeave.reason && (
                    <View style={styles.modalLeaveRow}>
                      <Text style={styles.modalLabel}>Reason</Text>
                      <Text style={styles.modalValue}>{selectedLeave.reason}</Text>
                    </View>
                  )}

                  {/* Status Badge */}
                  <View style={styles.modalStatusRow}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>PENDING APPROVAL</Text>
                    </View>
                  </View>

                  {/* Action Section */}
                  {!actionType ? (
                    <View style={styles.modalActionButtons}>
                      <TouchableOpacity
                        style={[styles.modalActionButton, styles.modalApproveButton]}
                        onPress={handleApproveClick}
                      >
                        <Text style={styles.modalApproveButtonText}>Approve</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalActionButton, styles.modalRejectButton]}
                        onPress={handleRejectClick}
                      >
                        <Text style={styles.modalRejectButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ) : actionType === "approve" ? (
                    <View style={styles.modalConfirmSection}>
                      <Text style={styles.modalConfirmTitle}>Confirm Approval</Text>
                      <Text style={styles.modalConfirmMessage}>
                        Are you sure you want to approve this leave request?
                      </Text>
                      <View style={styles.modalConfirmButtons}>
                        <TouchableOpacity
                          style={[styles.modalConfirmButton, styles.modalCancelButton]}
                          onPress={handleCancelAction}
                        >
                          <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalConfirmButton, styles.modalApproveConfirmButton]}
                          onPress={handleConfirmApprove}
                        >
                          <Text style={styles.modalApproveConfirmButtonText}>Yes, Approve</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalConfirmSection}>
                      <Text style={styles.modalConfirmTitle}>Reject Leave Request</Text>
                      <Text style={styles.modalConfirmMessage}>
                        Please provide a reason for rejecting this leave request:
                      </Text>
                      <TextInput
                        style={styles.rejectionReasonInput}
                        placeholder="Enter rejection reason..."
                        placeholderTextColor="#999999"
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                      <View style={styles.modalConfirmButtons}>
                        <TouchableOpacity
                          style={[styles.modalConfirmButton, styles.modalCancelButton]}
                          onPress={handleCancelAction}
                        >
                          <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalConfirmButton, 
                            styles.modalRejectConfirmButton,
                            !rejectionReason.trim() && styles.modalConfirmButtonDisabled
                          ]}
                          onPress={handleConfirmReject}
                          disabled={!rejectionReason.trim()}
                        >
                          <Text style={styles.modalRejectConfirmButtonText}>Confirm Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedLeave(null);
                      setRejectionReason("");
                      setActionType(null);
                    }}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default PendingLeavesScreen;

const styles = StyleSheet.create({
  filterContainer: {
    marginTop: -80,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  filterScrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f7f7f7ff",
    marginRight: 10,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollViewContent: {
    flex: 1,
  },
  scrollViewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  contentContainer: {
    gap: 12,
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
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  employeeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 12,
    color: "#666666",
  },
  leaveDetails: {
    // backgroundColor: Colors.gray,
    // padding: 12,
    // borderRadius: 12,
    // gap: 8,
    // borderWidth: 1,
    // borderColor: Colors.borderGray,
    paddingHorizontal: 12
  },
  leaveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    backgroundColor: "#E6E0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: "#FFAA00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leaveLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#666666",
    fontWeight: "400",
  },
  leaveValue: {
    marginTop: 4,
    fontSize: 13,
    color: "#000000",
    fontWeight: "600",
  },
  reasonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#212121ff",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: "#4d4d4dff",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: {
    backgroundColor: "#12b10fff",
  },
  rejectButton: {
    backgroundColor: "#c71a1aff",
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTop: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  emptyBottom: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessage: {
    marginTop: 16,
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  emptyDescription: {
    marginTop: 8,
    textAlign: "center",
    color: "#7b7b7bff",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalScrollView: {
    width: "100%",
    maxHeight: "90%",
    borderRadius: 20,
  },
  modalScrollContent: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000000",
  },
  modalEmployeeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  modalEmployeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalEmployeeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  modalEmployeeEmail: {
    fontSize: 13,
    color: "#666666",
  },
  modalLeaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGray,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    alignItems: "center",
    flex: 1,
  },
  modalValue: {
    alignItems: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "#595959",
    flex: 1,
    textAlign: "right",
  },
  modalStatusRow: {
    marginTop: 20,
    alignItems: "center",
  },
  modalActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalApproveButton: {
    backgroundColor: "#20b91eff",
  },
  modalRejectButton: {
    backgroundColor: "#da2323ff",
  },
  modalApproveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalRejectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalConfirmSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  modalConfirmTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  modalConfirmMessage: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 16,
    lineHeight: 20,
  },
  rejectionReasonInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  modalConfirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalApproveConfirmButton: {
    backgroundColor: "#3BB539",
  },
  modalRejectConfirmButton: {
    backgroundColor: "#FF6B6B",
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666666",
  },
  modalApproveConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalRejectConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    marginTop: -80,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
    gap: 7,
  },
  headerText: {
    fontSize: 16,
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
    justifyContent: "space-around",
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffaa00ff",
  },
  approvedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1ac40eff",
  },
  rejectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d13a32ff",
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

