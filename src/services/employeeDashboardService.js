import apiClient from './api';
import { dateRange, pickParams, trendParams } from '../utils/dashboardFilters';

const employeeDashboardService = {
  getEmployeeDashboard: (filters = {}) => apiClient.get('/employees/dashboard', {
    params: pickParams(trendParams(filters), ['startDate', 'endDate', 'period']),
  }),
  getTasks: (filters = {}) => apiClient.get('/employees/tasks', {
    params: { ...dateRange(filters), ...pickParams(filters, ['page', 'limit', 'status']) },
  }),
};

export default employeeDashboardService;
