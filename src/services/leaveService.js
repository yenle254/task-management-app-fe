import apiClient from './api';

const leaveService = {
  submitLeave: data => apiClient.post('/leaves', data),
  submitDraft: (id, data = {}) => apiClient.post(`/leaves/${id}/submit`, data),
  editLeave: (id, data) => apiClient.put(`/leaves/${id}/edit`, data),
  getMyLeaves: (params = {}) => apiClient.get('/leaves/my', { params }),
  getLeaveById: id => apiClient.get(`/leaves/${id}`),
  getPendingLeaves: (params = {}) => apiClient.get('/leaves/pending', { params }),
  approveLeave: (id, revision) => apiClient.put(`/leaves/${id}/approve`, { revision }),
  rejectLeave: (id, rejectionReason, revision) => apiClient.put(`/leaves/${id}/reject`, { rejectionReason, revision }),
  cancelLeave: (id, revision) => apiClient.delete(`/leaves/${id}`, { data: { revision } }),
  getLeaveBalance: year => apiClient.get('/leaves/balance', { params: year ? { year } : {} }),
  getTeamLeaves: (teamId, params = {}) => apiClient.get(`/leaves/team/${teamId}`, { params }),
};
export default leaveService;
