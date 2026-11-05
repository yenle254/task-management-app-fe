import React, { useState } from 'react';
import { View } from 'react-native';
import employeeService from '../../../services/employeeDashboardService';
import taskService from '../../../services/taskService';
import useDashboardResource, { useDashboardRefresh } from '../../../hooks/useDashboardResource';
import { collectPages, countTaskStatuses, daysOverdue, displayDate, displayNumber, records, responseData, responseRecords } from '../../../utils/dashboardData';
import { dateRange, presetRange } from '../../../utils/dashboardFilters';
import DashboardFilters from './dashboardFilters';
import WelcomeCard from './welcomeCard';
import { DashboardGrid, DataTable, Distribution, Metrics, Section, Trend, dashboardStyles } from './dashboardUI';

export default function EmployeeDashboardContent({ onRefresh }) {
  const [filters, setFilters] = useState(() => ({ ...presetRange(), period: 'week' }));
  const dashboard = useDashboardResource(JSON.stringify(filters), async () => responseData(await employeeService.getEmployeeDashboard(filters)));
  const range = dateRange(filters);
  const tasks = useDashboardResource(JSON.stringify(range), () => collectPages((page) => employeeService.getTasks({ ...range, page, limit: 100 })));
  const overdue = useDashboardResource('personal-overdue', async () => responseRecords(await taskService.getOverdueTasks()));
  useDashboardRefresh(onRefresh, [dashboard.reload, tasks.reload, overdue.reload]);
  const data = dashboard.data;
  return <View style={dashboardStyles.container}>
    <WelcomeCard title="My dashboard" subtitle="Your work, attendance and leave" />
    <DashboardFilters filters={filters} onChange={setFilters} />
    <Section title="My overview" resource={dashboard}>
      <Metrics items={[
        ['Awaiting review', data?.awaitingReviewCount],
        ['Submitted by me', data?.submittedByMeCount],
        ['In progress', data?.tasks?.inProgress, '', 'Current snapshot'],
        ['Completed', data?.tasks?.completed, '', 'Completion events in selected period'],
        ['Overdue', data?.tasks?.overdue, '', 'Currently open past deadline'],
        ['Work hours', data?.workHours?.total, ' h', 'Recorded attendance hours in selected period'],
        ['Leave remaining', data?.leaveBalance?.remaining, ' days', 'Current year balance; not period-specific'],
      ]} />
    </Section>
    <DashboardGrid>
      <Section title="Task status" resource={tasks} note="Current status of your tasks created in the selected period. Includes every page.">
        <Distribution rows={countTaskStatuses(tasks.data)} />
      </Section>
      <Section title="Performance trend" resource={dashboard} note="Your recorded task events in the selected period.">
        <Trend rows={data?.performanceTrend} />
      </Section>
      <Section title="Overdue tasks" resource={overdue} note="Current snapshot, oldest deadline first. Days overdue are elapsed full days, not deadline extensions.">
        <DataTable headers={['Task', 'Deadline', 'Days overdue']} rows={records(overdue.data)?.map((task) => [task.title, displayDate(task.dueDate), displayNumber(daysOverdue(task))])} />
      </Section>
    </DashboardGrid>
  </View>;
}
