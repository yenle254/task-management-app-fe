import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/authContext';
import useTaskStore from '../../../store/taskStore';
import TaskReviewPanel from '../../components/task/taskReviewPanel';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import AppButton from '../../components/appButton';
import Colors from '../../styles/color';
export default function ApprovalsScreen({ navigation }) {
  const { user } = useAuth();
  const { approvals, approvalsStats, approvalsLoading, approvalsError, approvalsPage, approvalsPages, fetchApprovals } = useTaskStore();
  const [overdueSla, setOverdueSla] = useState(false), [teamId, setTeamId] = useState(undefined), [page, setPage] = useState(1);
  const allowed = ['team_lead', 'hr_manager'].includes(user?.role);
  const load = useCallback(() => allowed ? fetchApprovals({ page, overdueSla, teamId }).catch(() => {}) : Promise.resolve(), [allowed, fetchApprovals, page, overdueSla, teamId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const button = (text, onPress, disabled = false) => <AppButton text={text} onPress={onPress} disabled={disabled || approvalsLoading} style={styles.button} textStyle={{ fontSize: 14 }} />;
  return <SafeAreaView style={styles.screen}>
    <HeaderWithBackButton title="Approvals & Reviews" onBackPress={() => navigation.goBack()} />
    {!allowed ? <Text style={styles.message}>Only task approvers can access this screen.</Text> : <FlatList data={approvals} keyExtractor={item => item._id}
      contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={approvalsLoading} onRefresh={load} />}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.title}>{approvalsStats ? `${approvalsStats.pending} awaiting review` : 'Awaiting review'}</Text>
        {!!approvalsStats && <Text>{approvalsStats.overdueSla} waiting over 24 hours</Text>}
        {button(overdueSla ? 'Show all reviews' : 'Show overdue SLA', () => { setOverdueSla(!overdueSla); setPage(1); })}
        {user.role === 'hr_manager' && <>
          {button('All teams', () => { setTeamId(undefined); setPage(1); })}
          {!teamId && (approvalsStats?.byTeam || []).map(team => <View key={team.teamId}>
            {button(`${approvals.find(t => (t.teamId?._id || t.teamId) === team.teamId)?.teamId?.name || 'Team ' + team.teamId} (${team.pending})`, () => { setTeamId(team.teamId); setPage(1); })}
          </View>)}
        </>}
        {!!approvalsError && <><Text accessibilityRole="alert">{approvalsError}</Text>{button('Retry', load)}</>}
      </View>}
      renderItem={({ item }) => <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.badge}>In Review</Text>
        <Text>Deadline: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No deadline'}</Text>
        {Date.now() - new Date(item.review.submittedAt) > 86400000 && <Text>Overdue SLA · waiting over 24 hours</Text>}
        <TaskReviewPanel task={item} inbox />
        {button('Open task', () => navigation.navigate('TaskDetail', { taskId: item._id }))}
      </View>}
      ListEmptyComponent={approvalsLoading ? <ActivityIndicator color={Colors.primary} /> : !approvalsError && <Text style={styles.message}>No tasks awaiting your review.</Text>}
      ListFooterComponent={<View style={styles.header}>
        <Text>Page {approvalsPage} / {Math.max(1, approvalsPages)}</Text>
        {button('Previous', () => setPage(page - 1), page <= 1)}
        {button('Next', () => setPage(page + 1), page >= approvalsPages)}
      </View>} />}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Colors.secondary },
  content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16, gap: 16 }, header: { gap: 12 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.black }, message: { padding: 16 },
  card: { padding: 16, borderRadius: 12, backgroundColor: Colors.white, gap: 8 },
  badge: { color: '#6941C6', backgroundColor: '#F4EBFF', alignSelf: 'flex-start', padding: 6, borderRadius: 8 },
  button: { minHeight: 44, height: 'auto', width: '100%', padding: 12, borderRadius: 12 }
});
