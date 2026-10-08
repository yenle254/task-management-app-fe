import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import Colors from "../../styles/color";
import officeService from "../../services/officeService";
import LocationIcon from "../../../assets/icons/location-tick.svg";
import ClockIcon from "../../../assets/icons/clock.svg";
import PlusIcon from "../../../assets/icons/plus.svg";
import DoneIcon from "../../../assets/icons/done.svg";
import TrashIcon from "../../../assets/icons/trash.svg";
import EditIcon from "../../../assets/icons/edit.svg";

const OfficeListScreen = ({ navigation }) => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingActive, setSettingActive] = useState(null);

  const fetchOffices = useCallback(async () => {
    try {
      const response = await officeService.getAllOffices();
      setOffices(response.data || []);
    } catch (error) {
      Alert.alert("Error", error?.error || "Failed to load offices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOffices();
  };

  const handleSetActive = async (office) => {
    if (office.isActive) return;

    Alert.alert(
      "Set Active Office",
      `Set "${office.name}" as the active office?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Active",
          onPress: async () => {
            try {
              setSettingActive(office._id);
              await officeService.setActiveOffice(office._id);
              fetchOffices();
              Alert.alert("Success", "Active office updated successfully");
            } catch (error) {
              Alert.alert("Error", error?.error || "Failed to set active office");
            } finally {
              setSettingActive(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (office) => {
    Alert.alert(
      "Delete Office",
      `Are you sure you want to delete "${office.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSettingActive(office._id);
              await officeService.deleteOffice(office._id);
              fetchOffices();
              Alert.alert("Success", "Office deleted successfully");
            } catch (error) {
              Alert.alert("Error", error?.error || "Failed to delete office");
            } finally {
              setSettingActive(null);
            }
          },
        },
      ]
    );
  };

  const renderOfficeItem = ({ item }) => {
    const isLoading = settingActive === item._id;

    return (
      <View style={styles.officeCard}>
        <View style={styles.officeHeader}>
          <View style={styles.officeInfo}>
            <Text style={styles.officeName}>{item.name}</Text>
            {item.isActive && (
              <View style={styles.activeBadge}>
                <DoneIcon width={12} height={12} fill={Colors.white} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("EditOffice", { office: item })}
            >
              <EditIcon width={20} height={20} fill={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <TrashIcon width={20} height={20} fill="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {item.address && (
          <View style={styles.infoRow}>
            <LocationIcon width={16} height={16} fill="#666" />
            <Text style={styles.infoText}>{item.address}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <LocationIcon width={16} height={16} fill="#666" />
          <Text style={styles.infoText}>
            {item.location?.lat?.toFixed(6)}, {item.location?.lng?.toFixed(6)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <ClockIcon width={16} height={16} fill="#666" />
          <Text style={styles.infoText}>
            Working hours: {item.workingHours?.start || "09:00"} - {item.workingHours?.end || "18:00"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.radiusText}>Radius: {item.radius || 200}m</Text>
          {!item.isActive && (
            <TouchableOpacity
              style={styles.setActiveButton}
              onPress={() => handleSetActive(item)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.setActiveText}>Set Active</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No offices found</Text>
      <Text style={styles.emptySubtext}>
        Create an office location to enable GPS check-in
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton
          title="Office Locations"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="Office Locations"
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={offices}
        renderItem={renderOfficeItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateOffice")}
      >
        <PlusIcon width={24} height={24} fill={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default OfficeListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  officeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  officeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  officeInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  officeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  radiusText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  setActiveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.frame,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  setActiveText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
