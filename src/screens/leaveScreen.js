import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import Colors from "../styles/color";
import Available from "../../assets/icons/available.svg";
import NoLeave from "../../assets/icons/no_leave.svg";
import Rejected from "../../assets/icons/rejected.svg";
import Approved from "../../assets/icons/approved.svg";
import Used from "../../assets/icons/used.svg";
import { useLeaveStore } from "../../store";
import AppButton from "../components/appButton";
import HeaderPromo from "../components/headerPromo";
import IconCardText from "../components/task/iconCardText";
import { useAuth } from "../contexts/authContext";

const LeaveScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("Review");
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const { user } = useAuth();
  

  const {
    leaves: allLeaves,
    leaveBalance,
    isLoading,
    error,
    fetchLeaves,
    fetchLeaveBalance,
    clearError,
  } = useLeaveStore();

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
      await Promise.all([fetchLeaves(), fetchLeaveBalance()]);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Group leaves by status - use useMemo để tránh re-compute
  const groupedLeaves = useMemo(() => {
    return {
      pending: allLeaves.filter((leave) => leave.status === "pending"),
      approved: allLeaves.filter((leave) => leave.status === "approved"),
      rejected: allLeaves.filter((leave) => leave.status === "rejected"),
    };
  }, [allLeaves]);

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

  const formatShortDate = (dateString) => {
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

  // Tính toán ngày đầu và cuối năm hiện tại
  const getCurrentYearRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    
    const formatDate = (date) => {
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };
    
    return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
  };

  const yearRange = getCurrentYearRange();

  const renderLeaveCard = (item) => {
    const startDateFormatted = formatDate(item.startDate);
    const endDateFormatted = formatDate(item.endDate);
    const title = formatShortDate(item.startDate);

    return (
      <Pressable
        key={item._id}
        style={styles.leaveCard}
        onPress={() => {
          setSelectedLeave(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.leaveHeader}>
          <Text style={styles.leaveDate}>{title}</Text>
          <Text style={styles.leaveType}>
            {item.type?.toUpperCase() || "LEAVE"}
          </Text>
        </View>

        <View style={styles.leaveDetails}>
          <View style={styles.leaveRow}>
            <Text style={styles.leaveLabel}>Leave Date</Text>
            <Text style={styles.leaveLabel}>Total Leave</Text>
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

        <View style={styles.statusContainer}>
          {selectedTab === "Approved" && item.approvedAt && (
            <View style={[styles.pill, styles.pillApproved]}>
              <Approved width={16} height={16} />
              <Text style={styles.pillTextApp}>
                Approved on {formatShortDate(item.approvedAt)}
              </Text>
            </View>
          )}
          {selectedTab === "Rejected" && item.rejectionReason && (
            <View style={[styles.pill, styles.pillRejected]}>
              <Rejected width={16} height={16} />
              <Text style={styles.pillTextRej}>{item.rejectionReason}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading leaves...</Text>
        </View>
      );
    }

    let data = [];
    switch (selectedTab) {
      case "Review":
        data = groupedLeaves.pending;
        break;
      case "Approved":
        data = groupedLeaves.approved;
        break;
      case "Rejected":
        data = groupedLeaves.rejected;
        break;
      default:
        data = [];
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyTop}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              Leave submitted
            </Text>
            <Text style={{ fontSize: 14, color: "#666666", marginTop: 8 }}>
              You have no {selectedTab.toLowerCase()} leaves at the moment.
            </Text>
          </View>

          <View style={styles.emptyBottom}>
            <NoLeave width={120} height={120} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "black",
                fontWeight: "bold",
              }}
            >
              No leave requests to display.
            </Text>
            <Text
              style={{ marginTop: 8, textAlign: "center", color: "#7b7b7bff" }}
            >
              Ready to catch some fresh air? Click the "Submit leave" and take
              that well-deserved break.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {data.map((item) => renderLeaveCard(item))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.secondary }}>
      <HeaderPromo
        text="Permission to escape!"
        subtext="Your annual escape hatch."
        color={Colors.primary}
      />

      <View style={styles.summary}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Total Leave</Text>
          <Text style={styles.headerSubtext}>
            Period {yearRange}
          </Text>
        </View>
        <View style={styles.body}>
          <IconCardText
            icon={<Available width={10} height={10} />}
            text={"Available"}
            subtext={leaveBalance.remaining || 0}
            subtextStyle={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          />
          <IconCardText
            icon={<Used width={10} height={10} />}
            text={"Leave Used"}
            subtext={leaveBalance.used || 0}
            subtextStyle={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "Review" && styles.activeTab]}
          onPress={() => setSelectedTab("Review")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Review" && styles.activeTabText,
            ]}
          >
            Review
          </Text>
          {groupedLeaves.pending.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {groupedLeaves.pending.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "Approved" && styles.activeTab]}
          onPress={() => setSelectedTab("Approved")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Approved" && styles.activeTabText,
            ]}
          >
            Approved
          </Text>
          {groupedLeaves.approved.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {groupedLeaves.approved.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "Rejected" && styles.activeTab]}
          onPress={() => setSelectedTab("Rejected")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Rejected" && styles.activeTabText,
            ]}
          >
            Rejected
          </Text>
          {groupedLeaves.rejected.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {groupedLeaves.rejected.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
        {renderTabContent()}
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <AppButton
          text="Submit Leave"
          onPress={() => navigation.navigate("SubmitLeave")}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          setSelectedLeave(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedLeave && (
              <>
                <Text style={styles.modalTitle}>Leave Details</Text>
                <Text style={{fontSize:14, fontWeight:"600", color:"#505050ff", alignSelf:"center", marginBottom:10}}>
                  Submitted by you on {formatDate(selectedLeave.createdAt)}
                </Text>
                <View style={styles.leaveRow}>
                    <Text style={styles.modalLabel}>Leave Type</Text>
                    <Text style={styles.modalValue}>{selectedLeave.type}</Text>
                </View>

                <View style={styles.leaveRow}>
                    <Text style={styles.modalLabel}>Date</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedLeave.startDate)} -{" "}
                      {formatDate(selectedLeave.endDate)}
                    </Text>
                </View>

                <View style={styles.leaveRow}>
                                  <Text style={styles.modalLabel}>Total Days</Text>
                <Text style={styles.modalValue}>
                  {selectedLeave.numberOfDays}{" "}
                  {selectedLeave.numberOfDays > 1 ? "Days" : "Day"}
                </Text>
                </View>

                {selectedLeave.reason && (
                  <>
                    <View style={styles.leaveRow}>
                                          <Text style={styles.modalLabel}>Reason</Text>
                    <Text style={styles.modalValue}>
                      {selectedLeave.reason}
                    </Text>
                    </View>
                  </>
                )}

                {/* Status */}
                {selectedLeave.status === "approved" &&
                  selectedLeave.approvedAt && (
                    <>
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusValue, {color:"#1ac40eff"}]}> Approved on{" "}
                        {formatDate(selectedLeave.approvedAt)}
                      </Text>
                    </View>
                    <Text style={[styles.statusValue, {marginTop:10, fontSize: 13, lineHeight: 20, color:"#575757ff", textAlign:"justify"}]}>
                      Your leave request is approved. Please ensure all your urgent tasks are completed or delegated before you leave. We hope you enjoy your well-deserved time off and return refreshed. 
                    </Text>
                    </>
                  )}

                {selectedLeave.status === "rejected" &&
                  selectedLeave.rejectionReason && (
                    <>
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusValue, {color:"#9f0606ff"}]}> Rejected on{" "}
                        {formatDate(selectedLeave.approvedAt)}
                      </Text>
                    </View>
                    <Text style={[styles.statusValue, {marginTop:10, fontSize: 13, lineHeight: 20, color:"#575757ff", textAlign:"justify"}]}>
                      Unfortunately, your leave request has been rejected. If you have any questions or need further clarification, please contact HR or your manager. We encourage you to discuss and resubmit your leave request when appropriate.
                    </Text>
                    </>
                  )}

                
                {selectedLeave.status === "pending" && (
                  <>
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusValue, {color:"#ffaa00ff"}]}>
                        Pending Approval
                      </Text>
                    </View>
                    <Text style={[styles.statusValue, {marginTop:10, fontSize: 13, lineHeight: 20, color:"#575757ff", textAlign:"justify"}]}>
                      Your leave request is currently under review. We appreciate your patience during this process. You will be notified once a decision has been made regarding your request.
                    </Text>
                  </>
                )}

                <AppButton
                  text="Close"
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedLeave(null);
                  }}
                  style={styles.closeButton}
                  textStyle={styles.closeButtonText}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LeaveScreen;

const styles = StyleSheet.create({
  container: {},
  leaveRow: {
    flexDirection: "row",
    marginTop: 20,
  },  
  statusRow: {
    flexDirection: "column",
    marginTop: 20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },  
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000ff",
    marginTop: 10,
    alignItems: "center",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#595959ff",
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
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
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    textAlign: "center",
    marginBottom: 15,
  },
  closeButton: {
    marginTop: 15,
    width: "90%",
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000ff",
    alignSelf: "flex-start",
    alignItems: "center",
    marginTop: 10
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#595959ff",
    alignSelf: "flex-start",
    alignItems: "center",
    marginTop: 10
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
  tabsContainer: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f7f7f7ff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 10,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
  submitButtonContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
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
  leaveHeader: {
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leaveDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
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
  leaveDetails: {
    backgroundColor: Colors.gray,
    padding: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    paddingHorizontal: 12,
  },
  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leaveLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "400",
  },
  leaveValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  statusContainer: {},
  emptyState: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillTextApp: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3bb539ff",
  },
  pillTextRej: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d13a32ff",
  },
  emptyBottom: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  reasonContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGray,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 18,
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
});
