import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Colors from "../../styles/color";
import SearchIcon from "../../../assets/icons/search.svg";

const LeaderSelectModal = ({
  visible,
  onClose,
  onConfirm,
  users,
  selectedLeader,
  onSelectLeader,
  searchQuery,
  onSearchChange,
  isLoading,
  isLoadingMore,
  onLoadMore,
  currentTeamId,
}) => {
  const renderUserItem = useCallback(
    ({ item }) => {
      const isLeadingAnotherTeam = !!item?.isLeadingAnotherTeam;
      const teamId = item?.teamId?._id || item?.teamId;
      const isInAnotherTeam = !!teamId && (!currentTeamId || teamId !== currentTeamId);

      return (
      <TouchableOpacity
        style={[
          styles.modalItem,
          selectedLeader?._id === item._id && styles.modalItemSelected,
        ]}
        onPress={() => onSelectLeader(item)}
      >
        <View style={styles.userItemContent}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.itemName,
                selectedLeader?._id === item._id && styles.itemNameSelected,
              ]}
            >
              {item.profile?.fullName || item.email}
            </Text>
            <Text style={styles.itemSubtext}>
              {item.profile?.position || "Employee"} •{" "}
              {item.profile?.department || "No Department"}
            </Text>

            {(isLeadingAnotherTeam || isInAnotherTeam) && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {isLeadingAnotherTeam
                    ? "Already leading another team"
                    : "Already in a team"}
                </Text>
              </View>
            )}
          </View>
          {selectedLeader?._id === item._id && (
            <View style={styles.selectedIndicator} />
          )}
        </View>
      </TouchableOpacity>
      );
    },
    [selectedLeader, onSelectLeader, currentTeamId]
  );

  return (
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
            <Text style={styles.modalTitle}>Select Team Leader</Text>
            <View style={styles.modalDivider} />

            <View style={styles.searchContainer}>
              <SearchIcon width={16} height={16} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange("")}>
                  <Text style={{ color: "#999" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.listContainer}>
            {isLoading && !isLoadingMore && users.length === 0 ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={renderUserItem}
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  isLoadingMore ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ padding: 10 }}
                    />
                  ) : null
                }
                ListEmptyComponent={
                  !isLoading && (
                    <Text style={styles.emptyText}>No users found</Text>
                  )
                }
              />
            )}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextClose}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !selectedLeader && styles.modalButtonDisabled,
              ]}
              onPress={onConfirm || onClose}
              disabled={!selectedLeader}
            >
              <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
    maxHeight: "90%",
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 10,
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
    tintColor: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  listContainer: {
    flex: 1,
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
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
  userItemContent: {
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
    fontSize: 13,
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
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
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
  statusBadge: {
    backgroundColor: "#FFD700" + "40",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B8860B",
  },
});

export default LeaderSelectModal;
