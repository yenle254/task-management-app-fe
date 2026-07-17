import api from "./api";

const statisticsService = {
  getOverviewStats: async () => {
    return await api.get("/statistics/overview");
  },

  getEmployeesByDepartment: async () => {
    return await api.get("/statistics/employees-by-department");
  },

  getAttendanceStats: async (month, year) => {
    return await api.get("/statistics/attendance", {
      params: { month, year },
    });
  },

  getLeaveStats: async (year) => {
    return await api.get("/statistics/leaves", {
      params: { year },
    });
  },

  getTaskStats: async () => {
    return await api.get("/statistics/tasks");
  },

  getTeamPerformance: async () => {
    return await api.get("/statistics/team-performance");
  },
};

export default statisticsService;
