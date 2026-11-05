import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import employeeService from '../../services/employeeDashboardService';
import taskService from '../../services/taskService';
import useDashboardResource, { useDashboardRefresh } from '../../hooks/useDashboardResource';
import { displayDate } from '../../utils/dashboardData';
import { homeTaskPage, homeTasks, localDay, scheduleTime } from '../../utils/employeeHomeData';
import Colors from '../../styles/color';
import WelcomeCard from './welcomeCard';
import CardMeeting from '../cardMeeting';
import CardTask from '../task/cardTask';
import AppNumber from '../appNumber';
import { Action } from './dashboard/dashboardUI';
import NoSchedule from '../../../assets/icons/no_schedules.svg';
import NoTask from '../../../assets/icons/notask.svg';

const PAGE_SIZE = 5;

function HomeSection({ title, subtitle, resource, count, children }) {
  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {resource.status === 'ready' && Number.isInteger(count) && <AppNumber number={count} />}
    </View>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {resource.status === 'loading' ? <ActivityIndicator color={Colors.primary} accessibilityLabel={`Loading ${title}`} />
      : resource.status === 'error' ? <View><Text style={styles.error}>{resource.error}</Text><Action onPress={resource.reload}>Retry {title}</Action></View>
        : children}
  </View>;
}

export default function EmployeeHomeContent({ navigation, onRefresh }) {
  const [page, setPage] = useState(1);
  const today = localDay();
  // Independent resources keep Home unfiltered by previous searches in the Task tab.
  const schedules = useDashboardResource(`home-calendar:${today}`, async () => homeTasks(await taskService.getCalendar({ from: today, to: today, scope: 'self' })));
  const tasks = useDashboardResource(`home-tasks:${page}`, async () => homeTaskPage(await taskService.getMyTasks({ page, limit: PAGE_SIZE, sort: 'createdAt_desc' }), page, PAGE_SIZE));
  const review = useDashboardResource('home-review', async () => (await employeeService.getEmployeeDashboard()).data);
  useDashboardRefresh(onRefresh, [schedules.reload, tasks.reload, review.reload]);
  useFocusEffect(useCallback(() => { schedules.reload(); tasks.reload(); review.reload(); }, [schedules.reload, tasks.reload, review.reload]));
  const openTask = task => navigation.navigate('TaskDetail', { taskId: task._id });
  return <View style={styles.container}>
    <WelcomeCard />
    <HomeSection title="Awaiting review" resource={review} count={review.data?.awaitingReviewCount}>
      <Text>{review.data?.submittedByMeCount ?? 0} submitted by you and awaiting approval</Text>
    </HomeSection>
    <HomeSection title="Today schedules" subtitle="Your scheduled tasks for today, do not forget to check them!" resource={schedules} count={schedules.data?.length}>
      {schedules.data?.length ? <>
        {schedules.data.slice(0, 3).map(task => <CardMeeting key={task._id} name={task.title} timeLabel={scheduleTime(task)}
          description={task.description} assignees={task.assignedTo || []} onPress={() => openTask(task)} />)}
        {schedules.data.length > 3 && <Action onPress={() => navigation.navigate('TaskCalendar', { scope: 'self' })}>View all {schedules.data.length} scheduled tasks</Action>}
      </> : <View style={styles.empty}><NoSchedule width={110} height={76} /><Text style={styles.emptyTitle}>No Schedule Available</Text><Text style={styles.subtitle}>No scheduled tasks for today.</Text></View>}
    </HomeSection>
    <HomeSection title="My tasks" resource={tasks} count={tasks.data?.total}>
      {tasks.data?.tasks?.length ? tasks.data.tasks.map(task => <CardTask key={task._id} name={task.title} description={task.description || ''}
        endDate={task.dueDate ? displayDate(task.dueDate) : 'No due date'} comment={task.comments?.length || 0}
        progress={task.progress ?? 0} category={task.status} flag={task.priority} assignees={task.assignedTo || []}
        onPress={() => openTask(task)} />)
        : <View style={styles.empty}><NoTask width={110} height={76} /><Text style={styles.emptyTitle}>No Task Assigned</Text><Text style={styles.subtitle}>Your assigned tasks will appear here.</Text></View>}
      {(page > 1 || tasks.data?.pages > 1) && <View style={styles.pagination}>
        <Action disabled={page <= 1} onPress={() => setPage(value => value - 1)}>Previous</Action>
        <Text style={styles.subtitle}>Page {page}{tasks.data?.pages ? ` / ${tasks.data.pages}` : ''}</Text>
        <Action disabled={!tasks.data || page >= tasks.data.pages} onPress={() => setPage(value => value + 1)}>Next</Action>
      </View>}
    </HomeSection>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 16 },
  section: { width: '90%', alignSelf: 'center', marginTop: 16, padding: 15, borderRadius: 12, backgroundColor: Colors.white, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.black },
  subtitle: { fontSize: 13, lineHeight: 18, color: '#666666' },
  empty: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.black },
  error: { color: '#B42318', marginBottom: 8 },
  pagination: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
