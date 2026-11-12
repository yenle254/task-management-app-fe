import React, { useState } from 'react';
import { View } from 'react-native';
import employeeService from '../../../services/employeeDashboardService';
import taskService from '../../../services/taskService';
import useDashboardResource, { useDashboardRefresh } from '../../../hooks/useDashboardResource';
import { collectPages, countTaskPriorities, countTaskStatuses, daysOverdue, displayDate, displayNumber, records, responseData, responseRecords, summarizeTaskHours } from '../../../utils/dashboardData';
import { dateRange, presetRange } from '../../../utils/dashboardFilters';
import DashboardFilters from './dashboardFilters';
import WelcomeCard from './welcomeCard';
import { DashboardGrid, DataTable, Distribution, EstimatedVsActualChart, Metrics, Section, Trend, dashboardStyles } from './dashboardUI';

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
    <Section title="My overview" resource={dashboard}>
      <Metrics items={[
        ['Awaiting review', data?.awaitingReviewCount],
        ['Submitted by me', data?.submittedByMeCount],
        ['In progress', data?.tasks?.inProgress, '', 'Snapshot'],
        ['Completed', data?.tasks?.completed, '', 'Completion events in selected period'],
        ['Overdue', data?.tasks?.overdue, '', 'Open past deadline'],
        ['Work hours', data?.workHours?.total, ' h', 'Recorded attendance hours in selected period'],
        ['Leave remaining', data?.leaveBalance?.remaining, ' days', 'Year balance; not period-specific'],
      ]} />
    </Section>
    <DashboardFilters filters={filters} onChange={setFilters} />
    <DashboardGrid>
      <Section title="Task status" resource={tasks} note="Status of your tasks created in the selected period. Includes every page.">
        <Distribution rows={countTaskStatuses(tasks.data)} />
      </Section>
      <Section title="Task priority" resource={tasks} note="Priority breakdown (High, Medium, Low) of your tasks created in the selected period.">
        <Distribution rows={countTaskPriorities(tasks.data)} />
      </Section>
      <Section title="Estimated vs Actual hours" resource={tasks} note="Comparison of estimated hours vs logged actual hours across your tasks in the selected period.">
        <EstimatedVsActualChart rows={summarizeTaskHours(tasks.data)} labelKey="label" />
      </Section>
      <Section title="Performance trend" resource={dashboard} note="Your recorded task events in the selected period.">
        <Trend rows={data?.performanceTrend} />
      </Section>
      <Section title="Overdue tasks" resource={overdue} note="Oldest deadline first. Days overdue are elapsed full days, not deadline extensions.">
        <DataTable headers={['Task', 'Deadline', 'Days overdue']} rows={records(overdue.data)?.map((task) => [task.title, displayDate(task.dueDate), displayNumber(daysOverdue(task))])} />
      </Section>
    </DashboardGrid>
  </View>;
}
