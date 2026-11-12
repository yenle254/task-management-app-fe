import apiClient from './api';

const officeService = {
  getAllOffices: async () => {
    try { return await apiClient.get('/offices'); } catch (error) { throw error; }
  },
  getActiveOffice: async () => {
    try { return await apiClient.get('/offices/active'); } catch (error) { throw error; }
  },
  createOffice: async (officeData) => {
    try { return await apiClient.post('/offices', officeData); } catch (error) { throw error; }
  },
  updateOffice: async (id, data) => {
    try { return await apiClient.put(`/offices/${id}`, data); } catch (error) { throw error; }
  },
  deleteOffice: async (id) => {
    try { return await apiClient.delete(`/offices/${id}`); } catch (error) { throw error; }
  },
  setActiveOffice: async (id) => {
    try { return await apiClient.put(`/offices/${id}/activate`); } catch (error) { throw error; }
  },
};

export default officeService;
