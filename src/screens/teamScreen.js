import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NoSchedules from "../../assets/icons/no_schedules.svg";
import { useTeamStore } from "../../store";
import AppButton from "../components/appButton";
import HeaderPromo from "../components/headerPromo";
import { TeamCard } from "../components/team";
import { useAuth } from "../contexts/authContext";
import Colors from "../styles/color";

const TeamScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { teams, isLoading, error, fetchTeams, clearError } = useTeamStore();
  const [refreshing, setRefreshing] = useState(false);

  const isHR = user?.role === "hr_manager";

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      clearError();
    }
  }, [error]);

  const loadTeams = async () => {
    await fetchTeams();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  };

  const handleTeamPress = (team) => {
    navigation.navigate("TeamDetails", { teamId: team._id });
  };

  const handleCreateTeam = () => {
    navigation.navigate("CreateTeam");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.secondary }}>
      <HeaderPromo
        text="Team Collaboration"
        subtext="Work together, achieve together, and build a successful future through collaboration and shared vision."
        color={Colors.primary}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerText}>All Teams</Text>
          <Text style={styles.headerSubtext}>
            {teams.length} {teams.length === 1 ? "team" : "teams"} in your
            organization
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading teams...</Text>
            </View>
          ) : teams.length === 0 ? (
            <View style={styles.emptyState}>
              <NoSchedules width={120} height={120} />
              <Text style={styles.emptyTitle}>No Teams Yet</Text>
              <Text style={styles.emptyText}>
                {isHR
                  ? "Create your first team to get started"
                  : "No teams available at the moment"}
              </Text>
            </View>
          ) : (
            <View style={styles.teamsContainer}>
              {teams.map((team) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  onPress={() => handleTeamPress(team)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {isHR && (
          <View style={styles.buttonContainer}>
            <AppButton
              text="Create New Team"
              onPress={handleCreateTeam}
              style={styles.createButton}
              textStyle={styles.createButtonText}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  header: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 13,
    color: "#666666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  teamsContainer: {
    marginTop: 20,
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
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
  createButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TeamScreen;
