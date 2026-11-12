import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import useUserStore from "../../../store/userStore";
import Colors from "../../styles/color";

const ROLE_FILTERS = [
  { key: "all", label: "All Members" },
  { key: "team_lead", label: "Team Lead" },
  { key: "employee", label: "Employee" },
];

const ROLE_OPTIONS = [
  {
    key: "employee",
    title: "Employee",
    subtitle: "Perform assigned tasks",
    iconType: "person",
  },
  {
    key: "team_lead",
    title: "Team Lead",
    subtitle: "Manage team members and tasks",
    iconType: "crown",
  },
];

const getInitials = (fullName, email) => {
  const source = (fullName || "").trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "MB";
};

const ManageMembersScreen = ({ navigation }) => {
  const {
    users,
    fetchUsers,
    updateUser,
    deleteUser,
    isLoading,
    isLoadingMore,
    pagination,
  } = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState("employee");
  const [isInitializing, setIsInitializing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const buildQueryParams = useCallback(
    (page = 1, currentSearch = searchQuery, currentRole = roleFilter) => {
      const params = {
        page,
        limit: 20,
      };
      if (currentSearch.trim()) {
        params.search = currentSearch.trim();
      }
      if (currentRole !== "all") {
        params.role = currentRole;
      }
      return params;
    },
    [searchQuery, roleFilter]
  );

  const loadInitialUsers = useCallback(async () => {
    try {
      setIsInitializing(true);
      await fetchUsers(buildQueryParams(1, searchQuery, roleFilter), false);
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to load members");
    } finally {
      setIsInitializing(false);
    }
  }, [fetchUsers, buildQueryParams, searchQuery, roleFilter]);

  useEffect(() => {
    loadInitialUsers();
  }, [roleFilter]);

  useEffect(() => {
    if (isInitializing) return;

    const timer = setTimeout(() => {
      fetchUsers(buildQueryParams(1, searchQuery, roleFilter), false).catch(
        () => {}
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedMembers = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === "employee" || u.role === "team_lead"
    );
  }, [users]);

  useEffect(() => {
    if (!selectedUser) return;
    const updated = displayedMembers.find((u) => u._id === selectedUser._id);
    if (updated) {
      setSelectedUser(updated);
    }
  }, [displayedMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers(buildQueryParams(1, searchQuery, roleFilter), false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    const currentPage = pagination?.page ?? pagination?.current ?? 1;
    const totalPages = pagination?.pages ?? pagination?.total ?? 1;
    if (!isLoading && !isLoadingMore && currentPage < totalPages) {
      fetchUsers(
        buildQueryParams(currentPage + 1, searchQuery, roleFilter),
        true
      ).catch(() => {});
    }
  };

  const handleSelectMember = useCallback((member) => {
    setSelectedUser((prev) => {
      if (prev?._id === member._id) {
        return null;
      }
      setTargetRole(member.role === "team_lead" ? "team_lead" : "employee");
      return member;
    });
  }, []);

  const handleCycleRoleFilter = () => {
    const order = ["all", "team_lead", "employee"];
    const nextIndex = (order.indexOf(roleFilter) + 1) % order.length;
    setRoleFilter(order[nextIndex]);
  };

  const handleShowRoleInfo = () => {
    Alert.alert(
      "Role Permissions",
      "• Employee: Perform assigned tasks and collaborate within a team.\n\n• Team Lead: Can be assigned to lead a team, manage team members, and review tasks.\n\nNote: A Team Lead currently leading a team must be replaced before changing their role back to Employee."
    );
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) {
      Alert.alert("Select a Member", "Please select a member from the list first.");
      return;
    }

    if (selectedUser.role === targetRole) {
      Alert.alert(
        "No Changes",
        `${
          selectedUser.profile?.fullName || selectedUser.email
        } already has the ${
          targetRole === "team_lead" ? "Team Lead" : "Employee"
        } role.`
      );
      return;
    }

    const nextRoleLabel =
      targetRole === "team_lead" ? "Team Lead" : "Employee";

    Alert.alert(
      "Confirm Role Change",
      `Change ${
        selectedUser.profile?.fullName || selectedUser.email
      }'s role to ${nextRoleLabel}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              await updateUser(selectedUser._id, {
                role: targetRole,
              });
              setSelectedUser(null);
              Alert.alert(
                "Success",
                `Updated role to ${nextRoleLabel} successfully.`
              );
            } catch (err) {
              Alert.alert(
                "Cannot Update Role",
                err?.error ||
                  err?.message ||
                  "Failed to update member role. Please try again."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteMember = (memberToDelete = selectedUser) => {
    if (!memberToDelete) {
      Alert.alert(
        "Select a Member",
        "Please select a member from the list to delete."
      );
      return;
    }

    const memberName =
      memberToDelete.profile?.fullName || memberToDelete.email;

    Alert.alert(
      "Delete Member",
      `Are you sure you want to deactivate and remove ${memberName} from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await deleteUser(memberToDelete._id);
              if (selectedUser?._id === memberToDelete._id) {
                setSelectedUser(null);
              }
              Alert.alert("Success", `${memberName} has been removed.`);
            } catch (err) {
              Alert.alert(
                "Error",
                err?.error || err?.message || "Failed to delete member."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    if (!selectedUser) {
      handleShowRoleInfo();
      return;
    }

    const memberName = selectedUser.profile?.fullName || selectedUser.email;
    Alert.alert(memberName, `Email: ${selectedUser.email}`, [
      {
        text: "Delete Member",
        style: "destructive",
        onPress: () => handleDeleteMember(selectedUser),
      },
      {
        text: "Clear Selection",
        onPress: () => setSelectedUser(null),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderMemberItem = useCallback(
    ({ item }) => {
      const isSelected = selectedUser?._id === item._id;
      const isLead = item.role === "team_lead";
      const initials = getInitials(item.profile?.fullName, item.email);
      const teamName = item.teamId?.name;

      return (
        <TouchableOpacity
          style={[styles.memberRow, isSelected && styles.memberRowSelected]}
          onPress={() => handleSelectMember(item)}
          activeOpacity={0.75}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.profile?.fullName || item.email}
            </Text>
            <Text style={styles.memberSubtitle} numberOfLines={1}>
              {item.email}
              {teamName ? ` • ${teamName}` : ""}
            </Text>
          </View>

          <View
            style={[
              styles.roleBadge,
              isLead ? styles.roleBadgeLead : styles.roleBadgeEmployee,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isLead
                  ? styles.roleBadgeLeadText
                  : styles.roleBadgeEmployeeText,
              ]}
            >
              {isLead ? "Team Lead" : "Employee"}
            </Text>
          </View>

          <View
            style={[
              styles.radioOuter,
              isSelected && styles.radioOuterSelected,
            ]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedUser, handleSelectMember]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.black} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Manage Members
          </Text>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleCycleRoleFilter}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons
                name="filter-outline"
                size={21}
                color={roleFilter !== "all" ? Colors.primary : Colors.black}
              />
              {roleFilter !== "all" && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleMoreOptions}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={Colors.black}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          Search and manage members & roles in your organization
        </Text>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#8E95A9"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#8E95A9"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={18} color="#8E95A9" />
            </TouchableOpacity>
          )}
        </View>

        {/* Role Filter Pill Tabs */}
        <View style={styles.filterTabsRow}>
          {ROLE_FILTERS.map((tab) => {
            const active = roleFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setRoleFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Member List */}
      <View style={styles.listWrapper}>
        {isInitializing ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.stateSubtext}>Loading members...</Text>
          </View>
        ) : displayedMembers.length === 0 && !isLoading ? (
          <View style={styles.centerState}>
            <Ionicons name="people-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No members found</Text>
            <Text style={styles.stateSubtext}>
              {searchQuery.trim()
                ? `No matching results for "${searchQuery}"`
                : "No members available in this category"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedMembers}
            keyExtractor={(item) => item._id}
            renderItem={renderMemberItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Bottom Role Selection & Action Sheet (only shown when a user is selected) */}
      {selectedUser && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Select Role</Text>
              <Text style={styles.sheetSelectedUser} numberOfLines={1}>
                {selectedUser.profile?.fullName || selectedUser.email}
              </Text>
            </View>

            <View style={styles.sheetHeaderActions}>
              <TouchableOpacity
                style={styles.deleteChipButton}
                onPress={() => handleDeleteMember(selectedUser)}
                disabled={actionLoading}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.deleteChipText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShowRoleInfo}
                style={styles.infoIconButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#14B8A6"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedUser(null)}
                style={styles.infoIconButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#667085" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Cards */}
          <View style={styles.roleCardsContainer}>
            {ROLE_OPTIONS.map((option) => {
              const isSelectedRole = targetRole === option.key;
              const isPerson = option.iconType === "person";

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.roleOptionCard,
                    isSelectedRole && styles.roleOptionCardSelected,
                  ]}
                  onPress={() => setTargetRole(option.key)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.roleOptionIconWrap,
                      isPerson
                        ? styles.roleOptionIconEmployee
                        : styles.roleOptionIconLead,
                    ]}
                  >
                    {isPerson ? (
                      <Ionicons
                        name="person"
                        size={20}
                        color={Colors.primary}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="crown"
                        size={22}
                        color="#F59E0B"
                      />
                    )}
                  </View>

                  <View style={styles.roleOptionTextWrap}>
                    <Text style={styles.roleOptionTitle}>{option.title}</Text>
                    <Text style={styles.roleOptionSubtitle}>
                      {option.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleRadioOuter,
                      isSelectedRole && styles.roleRadioOuterSelected,
                    ]}
                  >
                    {isSelectedRole && <View style={styles.roleRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              actionLoading && styles.primaryActionButtonDisabled,
            ]}
            onPress={handleUpdateRole}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryActionButtonText}>
                {`Update to ${
                  targetRole === "team_lead" ? "Team Lead" : "Employee"
                }`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#F7F7FB",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  filterActiveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.black,
    textAlign: "center",
    marginLeft: 28,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECEEF5",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.black,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterPill: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EAEBF3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#525866",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    paddingBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 4,
  },
  memberRowSelected: {
    backgroundColor: Colors.frame,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6E1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  memberInfo: {
    flex: 1,
    marginRight: 10,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.black,
    marginBottom: 2,
  },
  memberSubtitle: {
    fontSize: 13,
    color: "#667085",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 12,
  },
  roleBadgeLead: {
    backgroundColor: "#E8E4FF",
  },
  roleBadgeEmployee: {
    backgroundColor: "#DCEBFF",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  roleBadgeLeadText: {
    color: Colors.primary,
  },
  roleBadgeEmployeeText: {
    color: "#2563EB",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.black,
    marginTop: 12,
  },
  stateSubtext: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    marginTop: 6,
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.black,
  },
  sheetSelectedUser: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteChipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  deleteChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  infoIconButton: {
    padding: 2,
  },
  roleCardsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  roleOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    backgroundColor: "#F9FAFB",
  },
  roleOptionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.frame,
  },
  roleOptionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roleOptionIconEmployee: {
    backgroundColor: "#E6E1FF",
  },
  roleOptionIconLead: {
    backgroundColor: "#FEF3C7",
  },
  roleOptionTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 2,
  },
  roleOptionSubtitle: {
    fontSize: 12.5,
    color: "#667085",
  },
  roleRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  roleRadioOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  roleRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  primaryActionButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryActionButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default ManageMembersScreen;

