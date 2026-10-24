import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import statisticsService from '../../services/statisticsService';
import teamService from '../../services/teamService';
import useDashboardResource, { useDashboardRefresh } from '../../hooks/useDashboardResource';
import { collectPages, displayNumber, rankRows, rateWithPopulation, records, responseData, responseRecords } from '../../utils/dashboardData';
import { changeTeam, dateRange, pickParams, presetRange } from '../../utils/dashboardFilters';
import DashboardFilters, { SelectFilter } from './dashboard/dashboardFilters';
import { DashboardGrid, DataTable, Distribution, Metrics, Note, Section, SeriesChart, Trend, dashboardStyles } from './dashboard/dashboardUI';
import WelcomeCard from './dashboard/welcomeCard';

export default function HRDashboardContent({ onRefresh }) {
  const [filters, setFilters] = useState(() => ({ ...presetRange(), period: 'week', teamId: '', employeeId: '', status: '', priority: '' }));
  const range = dateRange(filters);
  const scope = pickParams(filters, ['teamId', 'employeeId']);
  const taskFilters = { ...range, ...scope, ...pickParams(filters, ['status', 'priority']) };
  const trendFilters = { ...range, ...scope, period: filters.period };
  const teamFilters = { ...range, ...scope };
  const teams = useDashboardResource('teams', () => collectPages((page) => teamService.getAllTeams({ page, limit: 100 }), true));
  const members = useDashboardResource(`members:${filters.teamId}`, async () => responseRecords(await teamService.getTeamMembers(filters.teamId)), !!filters.teamId);
  useEffect(() => {
    if (filters.employeeId && members.status === 'ready' && records(members.data)
      && !members.data.some((member) => member._id === filters.employeeId)) {
      setFilters((current) => ({ ...current, employeeId: '' }));
    }
  }, [filters.employeeId, members.status, members.data]);
  const overview = useDashboardResource('overview', async () => responseData(await statisticsService.getOverviewStats()));
  const attendance = useDashboardResource(JSON.stringify(range), async () => responseData(await statisticsService.getAttendanceStats(range)));
  const leaves = useDashboardResource(JSON.stringify(range), async () => responseData(await statisticsService.getLeaveStats(range)));
  const tasks = useDashboardResource(JSON.stringify(taskFilters), async () => responseData(await statisticsService.getTaskStats(taskFilters)));
  const trend = useDashboardResource(JSON.stringify(trendFilters), async () => responseData(await statisticsService.getPerformanceTrends(trendFilters)));
  const performance = useDashboardResource(JSON.stringify(teamFilters), async () => responseRecords(await statisticsService.getTeamPerformance(teamFilters)));
  const departments = useDashboardResource(JSON.stringify(scope), async () => responseRecords(await statisticsService.getEmployeesByDepartment(scope)));
  const departmentActivity = useDashboardResource(JSON.stringify(teamFilters), async () => responseRecords(await statisticsService.getDepartmentActivity(teamFilters)));
  useDashboardRefresh(onRefresh, [teams.reload, members.reload, overview.reload, attendance.reload, leaves.reload, tasks.reload, trend.reload, performance.reload, departments.reload, departmentActivity.reload]);
  const ranking = rankRows(performance.data, 'completionRate', 'totalTasks');
  const departmentRanking = rankRows(departments.data, 'count');
  const a = attendance.data;
  const l = leaves.data;
  return <View style={dashboardStyles.container}>
    <WelcomeCard title="HR dashboard" subtitle="Company activity overview" />
    <DashboardFilters filters={filters} onChange={setFilters}>
      <Note>Team and employee apply to task reports, trends, team rankings, department activity and current department headcount. Attendance and leave remain company-wide. Status and priority apply only to task statistics.</Note>
      <Section title="Team filter" resource={teams}>
        <SelectFilter label="Team" value={filters.teamId} options={[['', 'All teams'], ...(records(teams.data)?.map((team) => [team._id, team.name]) || [])]} onChange={(id) => setFilters(changeTeam(filters, id))} />
      </Section>
      {filters.teamId && <Section title="Employee filter" resource={members}>
        <SelectFilter label="Employee" value={filters.employeeId} options={[['', 'All team members'], ...(records(members.data)?.map((member) => [member._id, member.profile?.fullName || member.email]) || [])]} onChange={(employeeId) => setFilters({ ...filters, employeeId })} />
      </Section>}
      <SelectFilter label="Task status" value={filters.status} options={[['', 'All statuses'], ['todo', 'To Do'], ['in_progress', 'In Progress'], ['done', 'Completed']]} onChange={(status) => setFilters({ ...filters, status })} />
      <SelectFilter label="Task priority" value={filters.priority} options={[['', 'All priorities'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} onChange={(priority) => setFilters({ ...filters, priority })} />
    </DashboardFilters>
    <Section title="Company overview - current" resource={overview} note="All company records, independent of report filters. Active accounts include all roles.">
      <Metrics items={[[ 'Active accounts', overview.data?.totalEmployees ], ['Teams', overview.data?.totalTeams], ['Tasks', overview.data?.totalTasks], ['Pending leave requests', overview.data?.pendingLeaves]]} />
    </Section>
    <DashboardGrid>
      <Section title="Attendance" resource={attendance} note="Company-wide, selected dates. On-time = present records / (stored records + calculated absences), using the server's work schedule and lateness rules.">
        <Metrics items={[[ 'On-time attendance', rateWithPopulation(a?.onTimeRate, a?.totalRecords), '%', 'Not available when no attendance records are eligible' ], ['Recorded work hours', a?.totalWorkHours, ' h']]} />
        <Distribution rows={a?.counts ? ['present', 'late', 'absent'].map((status) => ({ _id: status, count: a.counts[status] })) : null} />
        <SeriesChart rows={a?.daily} valueKey="present" labelKey="date" unit="present records" kind="line" />
        <DataTable headers={['Date', 'Present', 'Late', 'Absent']} rows={records(a?.daily)?.map((row) => [row.date, displayNumber(row.present), displayNumber(row.late), displayNumber(row.absent)])} />
      </Section>
      <Section title="Leave" resource={leaves} note="Company-wide. Employees on leave counts distinct people with approved leave overlapping the selected dates. Pending requests are current, across all dates.">
        <Metrics items={[[ 'Employees on leave', l?.employeesOnLeave ], ['Pending requests - current', l?.pendingLeaves], ['Requests created in period', l?.createdLeaves]]} />
        <Distribution rows={l?.byType} />
        <Note>Requests created in the selected period, grouped by leave start month (UTC).</Note>
        <SeriesChart rows={l?.byYearMonth} valueKey="count" labelKey="_id" unit="leave requests" />
      </Section>
      <Section title="Task statistics" resource={tasks} note="Current status of tasks created in selected dates, with selected team, employee, status and priority. Overdue is the matching selected status intersected with open statuses.">
        <Metrics items={[[ 'Tasks', tasks.data?.totalTasks ], ['Completed', tasks.data?.doneTasks], ['Open', tasks.data?.openTasks], ['Completion rate', rateWithPopulation(tasks.data?.completionRate, tasks.data?.totalTasks), '%'], ['Overdue', tasks.data?.overdueTasks]]} />
        <Distribution rows={tasks.data?.byStatus} />
      </Section>
      <Section title="Performance trend" resource={trend} note="Selected dates, team and employee. Status and priority do not apply to this endpoint.">
        <Trend rows={trend.data?.trend} />
      </Section>
      <Section title="Team ranking" resource={performance} note={`Descending completion rate (done / total), tasks created ${filters.startDate} to ${filters.endDate}. Teams with no tasks are not ranked. Team and employee filters apply; status and priority do not. Member counts are current.`}>
        <SeriesChart rows={ranking} valueKey="completionRate" labelKey="teamName" unit="%" />
        <DataTable headers={['Team', 'Leader', 'Members', 'Tasks', 'Completed', 'Complete %']} rows={ranking?.map((row) => [row.teamName, row.leader, displayNumber(row.memberCount), displayNumber(row.totalTasks), displayNumber(row.completedTasks), displayNumber(row.completionRate)])} />
      </Section>
      <Section title="Department headcount ranking - current" resource={departments} note="Descending active headcount by profile department, using selected team and employee. Current snapshot; date filters do not apply. Headcount does not measure departmental activity.">
        <SeriesChart rows={departmentRanking} valueKey="count" labelKey="department" unit="people" />
      </Section>
      <Section title="Department task activity" resource={departmentActivity} note={`Tasks created ${filters.startDate} to ${filters.endDate}, grouped using each active assignee's current department and current task status. Shared tasks count once in each involved department. Team and employee filters apply; status and priority do not.`}>
        <SeriesChart rows={departmentActivity.data} valueKey="totalTasks" labelKey="department" unit="tasks" />
        <DataTable headers={['Department', 'Tasks', 'Completed', 'Open', 'Overdue']} rows={records(departmentActivity.data)?.map((row) => [row.department, displayNumber(row.totalTasks), displayNumber(row.completedTasks), displayNumber(row.openTasks), displayNumber(row.overdueTasks)])} />
      </Section>
    </DashboardGrid>
  </View>;
}
