import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../store/index';
import UserHeader from '../components/home/userHeader';
import HRDashboardContent from '../components/home/hrDashboardContent';
import EmployeeDashboardContent from '../components/home/dashboard/employeeDashboardContent';
import TeamLeadDashboardContent from '../components/home/dashboard/teamLeadDashboardContent';
import { useAuth } from '../contexts/authContext';
import Colors from '../styles/color';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const dashboardRefresh = useRef(null);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const loadNotifications = useCallback(() => Promise.allSettled([
    fetchUnreadCount(), fetchNotifications({ page: 1, limit: 5 }),
  ]), [fetchUnreadCount, fetchNotifications]);

  useFocusEffect(useCallback(() => {
    loadNotifications();
    const interval = setInterval(() => { loadNotifications(); dashboardRefresh.current?.(); }, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await Promise.allSettled([dashboardRefresh.current?.(), loadNotifications()]); }
    finally { setRefreshing(false); }
  };

  const Dashboard = { employee: EmployeeDashboardContent, team_lead: TeamLeadDashboardContent, hr_manager: HRDashboardContent }[user?.role];
  const teamId = typeof user?.teamId === 'object' ? user.teamId?._id : user?.teamId;
  return <SafeAreaView style={styles.container}>
    <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
    <UserHeader navigation={navigation} />
    <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}>
      {Dashboard ? <Dashboard key={`${user?._id}:${user?.role}:${teamId}`} onRefresh={dashboardRefresh} navigation={navigation} />
        : <Text>Dashboard is not available for this role.</Text>}
    </ScrollView>
  </SafeAreaView>;
};
export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  body: { backgroundColor: Colors.secondary },
});
