import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NoTask from "../../../assets/icons/notask.svg";
import PlusIcon from "../../../assets/icons/plus.svg";
import useTaskStore from "../../../store/taskStore";
import HeaderPromo from "../../components/headerPromo";
import CardTask from "../../components/task/cardTask";
import TaskStatusCard from "../../components/task/taskStatusCard";
import TaskFilterBar from "../../components/task/taskFilterBar";
import { useAuth } from "../../contexts/authContext";
import Colors from "../../styles/color";

import taskService from '../../services/taskService';
import { subscribeTaskReview } from '../../utils/taskReviewEvents';

const tabStatuses = { All: null, Todo: 'todo', InProgress: 'in_progress', 'In Review': 'in_review', Finished: 'done' };
const TaskScreen = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { user, canManageTasks, isLoading: authLoading } = useAuth();
  const { tasks, myTasks, taskStats, listLoading: isLoading, error, fetchTaskPage, fetchTaskStats, setFilters,
    resetFilters, filters, page, total, hasMore } = useTaskStore();
  const [approvalCount, setApprovalCount] = useState(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    const reload = () => { if (['team_lead', 'hr_manager'].includes(user?.role)) taskService.getPendingApprovalStats().then(response => { if (active) setApprovalCount(response.data.pending); }).catch(() => { if (active) setApprovalCount(null); }); };
    reload(); const unsubscribe = subscribeTaskReview(reload);
    return () => { active = false; unsubscribe(); };
  }, [user?._id, user?.role]));
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedView, setSelectedView] = useState('my');
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);
  const canViewAllTasks = user?.role === 'hr_manager' || user?.role === 'team_lead';
  const scope = canViewAllTasks ? selectedView : 'my';
  const status = tabStatuses[selectedTab];
  useEffect(() => {
    const timer = setTimeout(() => setFilters({ search: searchQuery }), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, setFilters]);
  const load = useCallback(async () => {
    if (!user || authLoading) return;
    try { await fetchTaskPage(scope, { ...filters, page: 1, status }); }
    catch { /* Store supplies the visible retry state. */ }
  }, [user, authLoading, fetchTaskPage, scope, status, filters]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useFocusEffect(useCallback(() => {
    if (user && !authLoading) fetchTaskStats().catch(() => {});
  }, [user, authLoading, fetchTaskStats]));
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const loadMore = async () => {
    if (!hasMore || isLoading || loadingMore.current) return;
    loadingMore.current = true;
    try { await fetchTaskPage(scope, { page: page + 1, status }); }
    catch { /* Store supplies error message. */ }
    finally { loadingMore.current = false; }
  };
  const data = scope === 'my' ? myTasks : tasks;
  if (authLoading || !user) return <View style={styles.fullScreenLoading}><ActivityIndicator color={Colors.primary} /></View>;
  const openView = name => navigation.navigate(name, name === 'KanbanBoard' ? { teamId: user.teamId?._id || user.teamId } : { scope: 'self' });
  return <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: Colors.secondary }}>
    <HeaderPromo text="Challenges ahead!" subtext="Plan your work, one task at a time." color={Colors.primary}
      style={[styles.promo, { height: Math.max(insets.top + 156, Math.min(width * 0.56, 224)) }]}
      titleStyle={[styles.promoTitle, { marginTop: insets.top + 16 }]} subtitleStyle={styles.promoSubtitle} />
    <View style={styles.taskList}>
    <FlatList
      style={{ flex: 1 }}
      data={data} keyExtractor={item => item._id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      onEndReached={loadMore} onEndReachedThreshold={0.3}
      ListHeaderComponent={<View>
        <View style={styles.summaryCard}>
          <Text style={styles.headerText}>Your tasks</Text>
          <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search title, description or tags" />
          {canViewAllTasks && <View style={styles.viewToggle}>{['my', 'all'].map(value =>
            <TouchableOpacity key={value} style={[styles.viewButton, scope === value && styles.activeViewButton]} onPress={() => setSelectedView(value)}>
              <Text style={scope === value ? styles.activeViewButtonText : styles.viewButtonText}>{value === 'my' ? 'My Tasks' : user.role === 'hr_manager' ? 'All Tasks' : 'Team Tasks'}</Text>
            </TouchableOpacity>)}</View>}
        </View>
        {scope === 'my' && <TaskStatusCard compact todoCount={taskStats?.todo || 0} inProgressCount={taskStats?.in_progress || 0} inReviewCount={taskStats?.in_review || 0} doneCount={taskStats?.done || 0} />}
        <View style={styles.viewModes}>
          <Text style={{ color: Colors.primary }}>List</Text>
          {canManageTasks() && <TouchableOpacity onPress={() => openView('KanbanBoard')}><Text>Board</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => openView('TaskCalendar')}><Text>Calendar</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => openView('TaskTimeline')}><Text>Timeline</Text></TouchableOpacity>
        </View>
        {canViewAllTasks && <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Approvals')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: Colors.primary }}>Approvals &amp; Reviews{approvalCount !== null ? ` (${approvalCount})` : ''}</Text></TouchableOpacity>}
        <TaskFilterBar style={styles.filters} filters={filters} onChange={setFilters} onReset={() => { resetFilters(); setSearchQuery(''); }} />
        <View style={styles.tabsContainer}>{Object.keys(tabStatuses).map(tab => <TouchableOpacity key={tab}
          onPress={() => setSelectedTab(tab)} style={[styles.tab, selectedTab === tab && styles.activeTab]}>
          <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab === 'InProgress' ? 'Ongoing' : tab}</Text>
        </TouchableOpacity>)}</View>
        <Text style={styles.resultCount}>{total} matching tasks</Text>
        {error && <TouchableOpacity onPress={load}><Text style={{ color: '#b42318' }}>{error} · Retry</Text></TouchableOpacity>}
      </View>}
      renderItem={({ item }) => <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })} style={{ marginBottom: 12 }}>
        <CardTask name={item.title} description={item.description || ''} endDate={item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}
          comment={item.comments?.length || 0} progress={item.progress || 0} category={item.status} flag={item.priority}
          bgColor={Colors.white} assignees={item.assignedTo || []} />
      </TouchableOpacity>}
      ListEmptyComponent={isLoading ? <ActivityIndicator color={Colors.primary} /> :
        <View style={styles.noTask}><NoTask width={136} height={100} /><Text style={styles.emptyText}>No tasks match these filters.</Text></View>}
      ListFooterComponent={isLoading && data.length > 0 ? <ActivityIndicator color={Colors.primary} /> : null}
    />
    </View>
    {canManageTasks() && <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTask')}><PlusIcon width={24} height={24} fill="#fff" /></TouchableOpacity>}
  </SafeAreaView>;
};
export default TaskScreen;

const styles = StyleSheet.create({
  promo: { flexShrink: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  promoTitle: { fontSize: 22, lineHeight: 28, marginLeft: 20, marginRight: 20 },
  promoSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 4, marginLeft: 20, marginRight: 20 },
  taskList: { flex: 1, marginTop: -72 },
  summaryCard: { backgroundColor: Colors.white, padding: 12, borderRadius: 12 },
  viewModes: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', minHeight: 44, marginTop: 8 },
  filters: { paddingHorizontal: 4, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  resultCount: { marginBottom: 8, fontSize: 12, color: '#666666' },
  emptyText: { fontSize: 13, fontWeight: '600', color: Colors.black, textAlign: 'center' },
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
  },
  summary: {
    marginTop: -80,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  headerSubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginTop: 4,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f7f7f7",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    minHeight: 40,
    fontSize: 13,
    color: "#000",
  },
  clearButton: {
    fontSize: 18,
    color: "#999",
    paddingHorizontal: 8,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeViewButton: {
    backgroundColor: Colors.primary,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
  },
  activeViewButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 0,
    padding: 3,
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginTop: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666666",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scrollViewContent: {
    flex: 1,
    alignItems: "center",
  },
  scrollViewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  contentContainer: {
    gap: 12,
    width: "90%",
  },
  noTask: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: 'center',
    gap: 16,
    width: "100%",
    minHeight: 240,
  },
  noTaskContainer: {
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
