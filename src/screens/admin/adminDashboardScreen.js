import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/authContext";
import Colors from "../../styles/color";
import UserHeader from "../../components/home/userHeader";
import HeaderPromo from "../../components/headerPromo";
import { Feather } from "@expo/vector-icons";

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handleCreateHRAccount = () => {
    navigation.navigate("CreateHrAccount");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.white}
        barStyle="dark-content"
        translucent={true}
      />
      <UserHeader navigation={navigation} />

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <HeaderPromo
          text="System Administration"
          subtext="Manage HR accounts and review activity"
          color="#DC2626"
        />

        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.profile?.fullName || "Admin"}
            </Text>
            <Text style={styles.roleText}>System Administrator</Text>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account Management</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCreateHRAccount}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Feather name="user-plus" size={24} color={Colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Create HR Account</Text>
                <Text style={styles.menuSubtitle}>
                  Create new HR Manager account
                </Text>
              </View>
              <View style={styles.menuArrow}>
                <Text style={styles.arrowText}>{">"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('AuditLog')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Feather name="shield" size={24} color={Colors.primary} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Audit Log</Text>
                <Text style={styles.menuSubtitle}>
                  Review activity and reasons for changes
                </Text>
              </View>
              <View style={styles.menuArrow}>
                <Text style={styles.arrowText}>{">"}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Quick Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employee ID:</Text>
                <Text style={styles.infoValue}>
                  {user?.profile?.employeeId || "N/A"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Department:</Text>
                <Text style={styles.infoValue}>
                  {user?.profile?.department || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  menuItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.frame,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  menuArrow: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "300",
  },
  infoSection: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
});
