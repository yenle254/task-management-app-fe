import api from './api';
import { calendarParams, dateRange, pickParams, taskParams, trendParams } from '../utils/dashboardFilters';

const statisticsService = {
  getOverviewStats: () => api.get('/statistics/overview'),
  getEmployeesByDepartment: (filters = {}) => api.get('/statistics/employees-by-department', {
    params: pickParams(filters, ['teamId', 'employeeId']),
  }),
  getDepartmentActivity: (filters = {}) => api.get('/statistics/department-activity', {
    params: { ...dateRange(filters), ...pickParams(filters, ['teamId', 'employeeId']) },
  }),
  // Preserve legacy positional calls alongside the filter object.
  getAttendanceStats: (month, year, startDate, endDate) => api.get('/statistics/attendance', {
    params: calendarParams(typeof month === 'object' && month !== null ? month : { month, year, startDate, endDate }),
  }),
  getLeaveStats: (year, month, startDate, endDate) => api.get('/statistics/leaves', {
    params: calendarParams(typeof year === 'object' && year !== null ? year : { year, month, startDate, endDate }),
  }),
  getTaskStats: (filters = {}) => api.get('/statistics/tasks', { params: taskParams(filters) }),
  getPerformanceTrends: (filters = {}, period) => api.get('/statistics/performance-trends', { params: trendParams(filters, period) }),
  getTeamPerformance: (filters = {}) => api.get('/statistics/team-performance', {
    params: { ...dateRange(filters), ...pickParams(filters, ['teamId', 'employeeId']) },
  }),
};

export default statisticsService;
