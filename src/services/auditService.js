import apiClient from './api';

// apiClient's response interceptor already returns response.data.
const auditService = {
  getAuditLogs: params => apiClient.get('/admin/audit-logs', { params }),
  getAuditLogById: id => apiClient.get(`/admin/audit-logs/${id}`),
  getTargetAuditLogs: (type, id, params) => apiClient.get(`/admin/audit-logs/target/${type}/${id}`, { params }),
};
export default auditService;
