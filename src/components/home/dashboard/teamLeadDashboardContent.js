import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../../contexts/authContext';
import teamService from '../../../services/teamService';
import useDashboardResource, { useDashboardRefresh } from '../../../hooks/useDashboardResource';
import { displayDate, displayNumber, overduePage, rankRows, rateWithPopulation, records, responseData, responseRecords } from '../../../utils/dashboardData';
import { presetRange } from '../../../utils/dashboardFilters';
import DashboardFilters from './dashboardFilters';
import WelcomeCard from './welcomeCard';
import { Action, DashboardGrid, DataTable, Distribution, Empty, Metrics, Section, SeriesChart, Trend, dashboardStyles } from './dashboardUI';

export default function TeamLeadDashboardContent({ onRefresh }) {
  const { user } = useAuth();
  const teamId = typeof user?.teamId === 'object' ? user.teamId?._id : user?.teamId;
  const [filters, setFilters] = useState(() => ({ ...presetRange(), period: 'week' }));
  const [page, setPage] = useState(1);
  const performance = useDashboardResource(`performance:${teamId}`, async () => responseData(await teamService.getPerformance(teamId)), !!teamId);
  const progress = useDashboardResource(`${teamId}:${JSON.stringify(filters)}`, async () => responseRecords(await teamService.getMemberProgress(teamId, filters)), !!teamId);
  const trend = useDashboardResource(`${teamId}:trend:${JSON.stringify(filters)}`, async () => responseData(await teamService.getPerformanceTrend(teamId, filters)), !!teamId);
  const overdue = useDashboardResource(`${teamId}:overdue:${page}`, async () => {
    const response = await teamService.getOverdue(teamId, { page, limit: 10 });
    return overduePage(response, page, 10);
  }, !!teamId);
  useEffect(() => {
    if (overdue.status === 'ready' && page > Math.max(1, overdue.data.pages)) setPage(Math.max(1, overdue.data.pages));
  }, [overdue.status, overdue.data, page]);
  useDashboardRefresh(onRefresh, [performance.reload, progress.reload, trend.reload, overdue.reload]);
  if (!teamId) return <View style={dashboardStyles.container}><Section title="Team dashboard"><Empty>No team is assigned to your account. A team assignment is required to request this report.</Empty></Section></View>;
  const data = performance.data;
  const counts = data?.taskCounts;
  const workload = rankRows(data?.workloadByMember, 'openTasks');
  return <View style={dashboardStyles.container}>
    <WelcomeCard title="Team dashboard" subtitle="Progress and workload in your team" />
    <DashboardFilters filters={filters} onChange={setFilters} />
    <Section title="Team overview — current" resource={performance} note="All current team tasks, independent of dates. On-time rate uses completion events with a deadline snapshot; the eligible completion count is shown separately.">
      <Metrics items={[
        ['In Review', data?.inReviewTasks], ['Pending approval', data?.pendingApproval],
        ['Total tasks', counts?.total], ['In progress', counts?.inProgress], ['Completed', counts?.done],
        ['Overdue', data?.overdueCount], ['Completion rate', rateWithPopulation(data?.completionRate, counts?.total), '%'], ['On-time completion', rateWithPopulation(data?.onTimeRate, data?.onTimeEligibleTasks), '%', `${displayNumber(data?.onTimeEligibleTasks)} eligible completions`],
      ]} />
    </Section>
    <DashboardGrid>
      <Section title="Team task status — current" resource={performance}>
        <Distribution rows={counts ? [{ _id: 'todo', count: counts.todo }, { _id: 'in_progress', count: counts.inProgress }, { _id: 'in_review', count: counts.inReview }, { _id: 'done', count: counts.done }] : null} />
      </Section>
      <Section title="Workload ranking — current" resource={performance} note="Descending open task count (To Do + In Progress + In Review), all dates. This is workload, not a diagnosis of overload. Shared assignments count for each assignee.">
        <SeriesChart rows={workload} valueKey="openTasks" labelKey="userName" unit="open tasks" />
      </Section>
      <Section title="Member progress" resource={progress} note={`Tasks created ${filters.startDate} to ${filters.endDate}. On-time denominator: eligible completions with recorded completion and deadline snapshots.`}>
        <DataTable headers={['Member', 'Total', 'To Do', 'In progress', 'In Review', 'Completed', 'Overdue', 'Complete %', 'On-time %', 'Eligible on-time']} rows={records(progress.data)?.map((row) => [row.userName, ...['totalTasks', 'todoTasks', 'inProgressTasks', 'awaitingReviewTasks', 'completedTasks', 'overdueTasks'].map((key) => displayNumber(row[key])), displayNumber(rateWithPopulation(row.completionRate, row.totalTasks)), displayNumber(rateWithPopulation(row.onTimeRate, row.onTimeEligibleTasks)), displayNumber(row.onTimeEligibleTasks)])} />
      </Section>
      <Section title="Overdue tasks — current" resource={overdue} note={`Oldest deadline first. Total: ${displayNumber(overdue.data?.total)}. This list is paginated; it is not used to calculate team totals.`}>
        <DataTable headers={['Task', 'Deadline', 'Days overdue']} rows={records(overdue.data?.tasks)?.map((task) => [task.title, displayDate(task.dueDate), displayNumber(task.daysOverdue)])} />
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <Action disabled={page <= 1} onPress={() => setPage(page - 1)}>Previous</Action>
          <Text>Page {page} / {Math.max(1, overdue.data?.pages ?? 1)}</Text>
          <Action disabled={!overdue.data || page >= overdue.data.pages} onPress={() => setPage(page + 1)}>Next</Action>
        </View>
      </Section>
      <Section title="Completion trend" resource={trend} note="Recorded create/completion history for this team and selected dates. Buckets without recorded events are omitted; legacy tasks without history cannot be assigned to historical buckets."><Trend rows={trend.data?.trend} /></Section>
    </DashboardGrid>
  </View>;
}
