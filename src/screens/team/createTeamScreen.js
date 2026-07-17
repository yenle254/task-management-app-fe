import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import LabeledTextInput from "../../components/profile/labeledTextInput";
import SelectInputField from "../../components/profile/selectInputField";
import AppButton from "../../components/appButton";
import Colors from "../../styles/color";
import { useTeamStore } from "../../../store";
import { LeaderSelectModal } from "../../components/team";
import TeamIcon from "../../../assets/icons/task-square.svg";
import UserIcon from "../../../assets/icons/user_delegation.svg";
import teamService from "../../services/teamService";

const CreateTeamScreen = ({ navigation }) => {
  const { createTeam, isLoading: teamLoading } = useTeamStore();

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

  useEffect(() => {
    if (!showLeaderModal) return;
    (async () => {
      try {
        setLeadersLoading(true);
        const response = await teamService.getAvailableLeaders();
        setLeaders(response.data || []);
      } catch (error) {
        Alert.alert("Error", error?.error || "Failed to load leaders");
      } finally {
        setLeadersLoading(false);
      }
    })();
  }, [showLeaderModal]);

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

    if (selectedLeader.teamId) {
      Alert.alert(
        "Not available",
        "This user already belongs to a team. Please choose another leader."
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
      const response = await createTeam({
        name: formData.name.trim(),
        description: formData.description.trim(),
        leaderId: formData.leaderId,
      });

      if (response.success) {
        Alert.alert("Success", "Team created successfully", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to create team");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Create New Team"
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
          text={teamLoading ? "Creating..." : "Create Team"}
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

export default CreateTeamScreen;
