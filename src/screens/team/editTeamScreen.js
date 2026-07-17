import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TeamIcon from "../../../assets/icons/task-square.svg";
import UserIcon from "../../../assets/icons/user_delegation.svg";
import { useTeamStore } from "../../../store";
import AppButton from "../../components/appButton";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import LabeledTextInput from "../../components/profile/labeledTextInput";
import SelectInputField from "../../components/profile/selectInputField";
import { LeaderSelectModal } from "../../components/team";
import Colors from "../../styles/color";
import teamService from "../../services/teamService";

const EditTeamScreen = ({ navigation, route }) => {
  const { teamId } = route.params;

  const {
    currentTeam,
    updateTeam,
    fetchTeamById,
    isLoading: teamLoading,
  } = useTeamStore();

  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leaderId: null,
  });

  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setIsInitializing(true);
      await fetchTeamById(teamId);
    } catch (error) {
      Alert.alert("Error", "Failed to load team data");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (currentTeam) {
      setFormData({
        name: currentTeam.name || "",
        description: currentTeam.description || "",
        leaderId: currentTeam.leaderId?._id || null,
      });

      if (currentTeam.leaderId) {
        setSelectedLeader(currentTeam.leaderId);
      }
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!showLeaderModal) return;
    (async () => {
      try {
        setLeadersLoading(true);
        const response = await teamService.getAvailableLeaders({ excludeTeamId: teamId });
        setLeaders(response.data || []);
      } catch (error) {
        Alert.alert("Error", error?.error || "Failed to load leaders");
      } finally {
        setLeadersLoading(false);
      }
    })();
  }, [showLeaderModal, teamId]);

  const filteredLeaders = leaders.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (u.profile?.fullName || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectLeader = (user) => {
    setSelectedLeader(user);
    handleChange("leaderId", user._id);
  };

  const handleConfirmLeader = () => {
    if (!selectedLeader) return;

    if (selectedLeader.isLeadingAnotherTeam) {
      Alert.alert(
        "Not available",
        "This team lead is already leading another team. Please choose another leader."
      );
      return;
    }

    const leaderTeamId = selectedLeader?.teamId?._id || selectedLeader?.teamId;
    if (leaderTeamId && leaderTeamId !== teamId) {
      Alert.alert(
        "Not available",
        "This user already belongs to another team. Please choose another leader."
      );
      return;
    }

    setShowLeaderModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Team name is required");
      return;
    }

    if (!formData.leaderId) {
      Alert.alert("Validation Error", "Please select a team leader");
      return;
    }

    try {
      const response = await updateTeam(teamId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        leaderId: formData.leaderId,
      });

      if (response.success) {
        Alert.alert("Success", "Team updated successfully", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to update team");
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Edit Team"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading team data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Edit Team"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <LabeledTextInput
            label="Team Name"
            placeholder="Enter team name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            Icon={TeamIcon}
          />

          <LabeledTextInput
            label="Description"
            placeholder="Enter team description"
            value={formData.description}
            onChangeText={(text) => handleChange("description", text)}
            multiline
            numberOfLines={4}
          />

          <SelectInputField
            label="Team Leader"
            value={selectedLeader?.profile?.fullName || selectedLeader?.email}
            placeholder="Select team leader"
            onPress={() => {
              setSearchQuery("");
              setShowLeaderModal(true);
            }}
            Icon={UserIcon}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <AppButton
          text={teamLoading ? "Updating..." : "Update Team"}
          onPress={handleSubmit}
          style={[
            styles.submitButton,
            teamLoading && styles.submitButtonDisabled,
          ]}
          textStyle={styles.submitButtonText}
          disabled={teamLoading}
        />
      </View>

      <LeaderSelectModal
        visible={showLeaderModal}
        onClose={() => setShowLeaderModal(false)}
        onConfirm={handleConfirmLeader}
        users={filteredLeaders}
        selectedLeader={selectedLeader}
        onSelectLeader={handleSelectLeader}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={leadersLoading}
        isLoadingMore={false}
        onLoadMore={null}
        currentTeamId={teamId}
      />
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
  form: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 20,
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

export default EditTeamScreen;
