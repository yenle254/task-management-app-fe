import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTeamStore } from "../../../store/index";
import useUserStore from "../../../store/userStore";
import AppButton from "../../components/appButton";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import { SearchBar, UserCard } from "../../components/team";
import Colors from "../../styles/color";

const AddMemberScreen = ({ navigation, route }) => {
  const { teamId } = route.params;
  const {
    currentTeam,
    addMember,
    fetchTeamById,
    isLoading: teamLoading,
  } = useTeamStore();

  const {
    users,
    fetchUsers,
    isLoading: userLoading,
    isLoadingMore,
    pagination,
  } = useUserStore();

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamId]);

  const loadData = async () => {
    try {
      setIsInitializing(true);
      await Promise.all([
        fetchTeamById(teamId),
        fetchUsers({ page: 1, limit: 10, search: "" }),
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isInitializing) return;

    const delayDebounceFn = setTimeout(() => {
      fetchUsers({
        search: searchQuery,
        page: 1,
        limit: 10,
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!userLoading && !isLoadingMore && pagination.page < pagination.pages) {
      fetchUsers(
        {
          search: searchQuery,
          page: pagination.page + 1,
          limit: 10,
        },
        true
      );
    }
  };

  const isUserAlreadyMember = (userId) => {
    if (!currentTeam?.memberIds) return false;
    return currentTeam.memberIds.some((member) => member._id === userId);
  };

  const getDisabledReason = (user) => {
    if (!user) return null;
    if (isUserAlreadyMember(user._id)) return "Already a member";

    const userTeamId = user?.teamId?._id || user?.teamId;
    if (userTeamId) {
      if (userTeamId === teamId) return "Already in this team";
      return "In another team";
    }

    return null;
  };

  const handleToggleUser = useCallback((user) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const isUserSelected = (userId) => {
    return selectedUsers.some((u) => u._id === userId);
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please select at least one member to add"
      );
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const user of selectedUsers) {
        try {
          await addMember(teamId, user._id);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }

      await fetchTeamById(teamId);

      if (failCount === 0) {
        Alert.alert(
          "Success",
          `Successfully added ${successCount} ${
            successCount === 1 ? "member" : "members"
          }`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Partial Success",
          `Added ${successCount} members successfully. ${failCount} failed.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to add members");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }) => {
      const disabledReason = getDisabledReason(item);
      return (
        <UserCard
          user={item}
          isSelected={isUserSelected(item._id)}
          onToggle={handleToggleUser}
          isAlreadyMember={isUserAlreadyMember(item._id)}
          disabledReason={disabledReason}
        />
      );
    },
    [selectedUsers, currentTeam, teamId]
  );

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Add Members"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Add Members"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, email, position..."
          onClear={handleClearSearch}
        />

        {/* Selected Count */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedUsers.length}{" "}
              {selectedUsers.length === 1 ? "user" : "users"} selected
            </Text>
          </View>
        )}

        <View style={styles.listContainer}>
          {users.length === 0 && !userLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `No results found for "${searchQuery}"`
                  : "No users available"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          )}

          {userLoading && !isLoadingMore && (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            text={
              teamLoading
                ? "Adding..."
                : `Add ${selectedUsers.length} ${
                    selectedUsers.length === 1 ? "Member" : "Members"
                  }`
            }
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              (teamLoading || selectedUsers.length === 0) &&
                styles.submitButtonDisabled,
            ]}
            textStyle={styles.submitButtonText}
            disabled={teamLoading || selectedUsers.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  selectedCountContainer: {
    backgroundColor: Colors.primary + "20",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  listContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  centerLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  buttonContainer: {
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
});

export default AddMemberScreen;
