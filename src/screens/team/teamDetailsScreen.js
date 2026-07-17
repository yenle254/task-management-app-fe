import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import Colors from "../../styles/color";
import { useTeamStore } from "../../../store";
import { useAuth } from "../../contexts/authContext";
import { MemberCard, TeamInfoCard } from "../../components/team";

const TeamDetailsScreen = ({ navigation, route }) => {
  const { teamId } = route.params;
  const { user } = useAuth();
  const {
    currentTeam,
    isLoading,
    fetchTeamById,
    removeMember,
    clearError,
    error,
  } = useTeamStore();

  const [members, setMembers] = useState([]);

  const isHR = user?.role === "hr_manager";
  const isTeamLead = currentTeam?.leaderId?._id === user?._id;
  const canManage = isHR || isTeamLead;

  useEffect(() => {
    loadTeamDetails();
  }, [teamId]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      clearError();
    }
  }, [error]);

  useEffect(() => {
    if (currentTeam?.memberIds) {
      setMembers(currentTeam.memberIds);
    }
  }, [currentTeam]);

  const loadTeamDetails = async () => {
    await fetchTeamById(teamId);
  };

  const handleRemoveMember = async (member) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${
        member.profile?.fullName || member.email
      } from this team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(teamId, member._id);
              Alert.alert("Success", "Member removed successfully");
              await loadTeamDetails();
            } catch (error) {
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleAddMember = () => {
    navigation.navigate("AddMember", { teamId });
  };

  const handleEditTeam = () => {
    navigation.navigate("EditTeam", { teamId });
  };

  if (isLoading || !currentTeam) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Team Details"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading team details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Team Details"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TeamInfoCard
          team={currentTeam}
          membersCount={members.length}
          onEdit={handleEditTeam}
          canEdit={isHR}
        />

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team members</Text>
            {canManage && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMember}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.membersContainer}>
            {members.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                isLeader={member._id === currentTeam.leaderId?._id}
                onRemove={handleRemoveMember}
                canRemove={canManage}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  scrollContent: {
    padding: 16,
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
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  membersContainer: {
    gap: 12,
  },
});

export default TeamDetailsScreen;
