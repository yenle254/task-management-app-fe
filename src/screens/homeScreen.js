import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNotificationStore,
  useTaskStore,
  useStatisticsStore,
} from "../../store/index";
import TodayFocusCard from "../components/home/todayFocusCard";
import OverdueTaskCard from "../components/home/overdueTaskCard";
import UserHeader from "../components/home/userHeader";
import WelcomeCard from "../components/home/welcomeCard";
import HRDashboardContent from "../components/home/hrDashboardContent";
import { useAuth } from "../contexts/authContext";
import Colors from "../styles/color";

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { user } = useAuth();
  const isHR = user?.role === "hr_manager";

  const hrDashboardRefresh = useRef(null);

  const { fetchMyTasks, fetchTaskStats } = useTaskStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const { loadAllStats } = useStatisticsStore();

  useEffect(() => {
    const initialLoad = async () => {
      setInitialLoading(true);
      try {
        if (isHR) {
          await Promise.all([
            loadAllStats(false), 
            fetchUnreadCount(),
            fetchNotifications({ page: 1, limit: 5 }),
          ]);
        } else {
          await Promise.all([
            fetchMyTasks(),
            fetchTaskStats(),
            fetchUnreadCount(),
            fetchNotifications({ page: 1, limit: 5 }),
          ]);
        }
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    initialLoad();
  }, [isHR]); 

  useFocusEffect(
    React.useCallback(() => {
      const interval = setInterval(() => {
        if (isHR) {
          loadAllStats(false);
        } else {
          fetchMyTasks();
          fetchTaskStats();
        }
        fetchUnreadCount();
      }, 60000);

      return () => clearInterval(interval);
    }, [isHR])
  );

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      if (isHR) {
        if (hrDashboardRefresh.current) {
          await hrDashboardRefresh.current();
        }
        await fetchNotifications({ page: 1, limit: 5 });
      } else {
        await Promise.all([
          fetchMyTasks(),
          fetchTaskStats(),
          fetchUnreadCount(),
          fetchNotifications({ page: 1, limit: 5 }),
        ]);
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor={Colors.white}
          barStyle="dark-content"
          translucent={true}
        />
        <UserHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isHR ? (
          <HRDashboardContent onRefresh={hrDashboardRefresh} />
        ) : (
          <>
            <WelcomeCard />
            <TodayFocusCard navigation={navigation} />
            <OverdueTaskCard navigation={navigation} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  body: {
    backgroundColor: Colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});