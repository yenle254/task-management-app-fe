import { create } from 'zustand';
import { taskReviewActions, reviewInitialState } from './taskReviewActions';
import taskService from '../src/services/taskService';

const defaultFilters = () => ({ status: null, priority: null, teamId: null, search: '',
  sort: 'createdAt_desc', tags: [], fromDate: null, toDate: null, assigneeId: null, page: 1, limit: 20 });
const queryParams = filters => Object.fromEntries(Object.entries({ ...filters,
  tags: Array.isArray(filters.tags) ? filters.tags.join(',') : filters.tags
}).filter(([, value]) => value !== null && value !== undefined && value !== ''));
const mergePage = (previous, items, page) => page === 1 ? items : [...new Map([...previous, ...items].map(item => [item._id, item])).values()];
const advancedActions = (set, get) => {
  const actions = {};
  const readRequests = {};
  const mutations = ["setParentTask","removeParentTask","addChecklist","updateChecklist","deleteChecklist","addChecklistItem","updateChecklistItem","deleteChecklistItem","addDependencies","removeDependency","addWatcher","removeWatcher","setTags","updateEstimate","addTimeEntry","deleteTimeEntry","deleteAttachment"];
  mutations.forEach(name => {
    actions[name] = async (...args) => {
      const sessionVersion = get().sessionVersion;
      set({ advancedLoading: true, error: null });
      try {
        const response = await taskService[name](...args);
        const updated = response.data?.task || response.data;
        if (get().sessionVersion === sessionVersion) get().syncTask(updated);
        return response;
      } catch (error) { if (get().sessionVersion === sessionVersion) set({ error: error?.error || error.message || 'Task update failed' }); throw error; }
      finally { if (get().sessionVersion === sessionVersion) set({ advancedLoading: false }); }
    };
  });
  ['getTaskChildren', 'getDependencies', 'getWatchers', 'getWatchingTasks', 'getTimeEntries'].forEach(name => {
    actions[name] = (...args) => taskService[name](...args);
  });
  Object.entries({ getBoard: 'taskBoard', getCalendar: 'calendarTasks', getTimeline: 'timelineTasks', getTaskHistory: 'taskHistory' }).forEach(([name, key]) => {
    actions[name] = async (...args) => {
      if (name === 'getBoard') set({ boardQuery: args[0] || {} });
      const sessionVersion = get().sessionVersion;
      const requestId = (readRequests[key] || 0) + 1;
      const current = () => get().sessionVersion === sessionVersion && readRequests[key] === requestId;
      readRequests[key] = requestId;
      set({ error: null, [key]: key === 'taskBoard' ? { todo: [], in_progress: [], in_review: [], done: [] } : [] });
      try {
        const response = await taskService[name](...args);
        if (current()) set({ [key]: response.data });
        return response;
      } catch (error) { if (current()) set({ error: error?.error || error.message }); throw error; }
    };
  });
  return actions;
};

const useTaskStore = create((set, get) => ({
  ...advancedActions(set, get),
  ...reviewInitialState, ...taskReviewActions(set, get),
  boardQuery: null, lastListQuery: null,
  taskBoard: { todo: [], in_progress: [], in_review: [], done: [] }, calendarTasks: [], timelineTasks: [], taskHistory: [],
  advancedLoading: false, listLoading: false, page: 1, pages: 0, total: 0, hasMore: false,
  listRequestId: 0, detailRequestId: 0, sessionVersion: 0,
  syncTask: updated => set(state => ({
    tasks: state.tasks.map(task => task._id === updated._id ? updated : task),
    myTasks: state.myTasks.map(task => task._id === updated._id ? updated : task),
    teamTasks: state.teamTasks.map(task => task._id === updated._id ? updated : task),
    selectedTask: state.selectedTask?._id === updated._id ? updated : state.selectedTask
  })),
  fetchTaskPage: async (scope, params = {}) => {
    const filters = { ...get().filters, ...params };
    set({ lastListQuery: { scope, params: filters } });
    const requestId = get().listRequestId + 1;
    set({ listRequestId: requestId, listLoading: true, error: null,
      ...(Number(filters.page) === 1 ? { [scope === 'my' ? 'myTasks' : 'tasks']: [], page: 1, total: 0, hasMore: false } : {}) });
    try {
      const response = await (scope === 'my' ? taskService.getMyTasks : taskService.getAllTasks)(queryParams(filters));
      if (get().listRequestId !== requestId) return response;
      const key = scope === 'my' ? 'myTasks' : 'tasks';
      set(state => ({ [key]: mergePage(state[key], response.data || [], filters.page),
        page: response.page || 1, pages: response.pages || 0, total: response.total || 0,
        hasMore: (response.page || 1) < (response.pages || 0), listLoading: false }));
      return response;
    } catch (error) {
      if (get().listRequestId === requestId) set({ listLoading: false, error: error?.error || 'Failed to fetch tasks' });
      throw error;
    }
  },
  // States
  tasks: [],
  myTasks: [],
  teamTasks: [],
  selectedTask: null,
  taskStats: null,
  isLoading: false,
  error: null,
  
  // Filters
  filters: defaultFilters(),

  /**
   * Fetch all tasks with filters
   * @param {Object} params - Optional filter parameters
   */
  fetchTasks: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const filters = { ...get().filters, ...params };
      const response = await taskService.getAllTasks(queryParams(filters));
      
      set({ 
        tasks: response.data || [],
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch tasks',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch tasks assigned to current user
   * @param {Object} params - Optional filter parameters
   */
  fetchMyTasks: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.getMyTasks(queryParams({ ...get().filters, ...params }));
      
      set({ 
        myTasks: response.data || [],
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch my tasks',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch team tasks
   * @param {string} teamId
   * @param {Object} params - Optional filter parameters
   */
  fetchTeamTasks: async (teamId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.getTeamTasks(teamId, queryParams({ ...get().filters, ...params }));
      
      set({ 
        teamTasks: response.data || [],
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch team tasks',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Get task by ID
   * @param {string} id
   */
  fetchTaskById: async (id) => {
    const requestId = get().detailRequestId + 1;
    set({ detailRequestId: requestId, isLoading: true, error: null, selectedTask: get().selectedTask?._id === id ? get().selectedTask : null });
    try {
      const response = await taskService.getTaskById(id);
      if (get().detailRequestId !== requestId) return response;
      set({ 
        selectedTask: response.data,
        isLoading: false 
      });
      
      return response;
    } catch (error) {
      if (get().detailRequestId !== requestId) throw error;
      set({ 
        error: error?.error || 'Failed to fetch task details',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Create a new task
   * @param {Object} taskData - Task creation data
   */
  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.createTask(taskData);
      const newTask = response.data;
      
      set(state => ({
        tasks: [newTask, ...state.tasks],
        isLoading: false
      }));

      // Refresh in the background without turning a saved task into a creation error.
      get().fetchMyTasks().catch(() => {});
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to create task',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Update task
   * @param {string} id
   * @param {Object} updateData - Task update data
   */
  updateTask: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.updateTask(id, updateData);
      const updatedTask = response.data;
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        myTasks: state.myTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        teamTasks: state.teamTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        selectedTask: state.selectedTask?._id === id 
          ? updatedTask 
          : state.selectedTask,
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to update task',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Delete task
   * @param {string} id
   */
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.deleteTask(id);
      
      set(state => ({
        tasks: state.tasks.filter(task => task._id !== id),
        myTasks: state.myTasks.filter(task => task._id !== id),
        teamTasks: state.teamTasks.filter(task => task._id !== id),
        selectedTask: state.selectedTask?._id === id 
          ? null 
          : state.selectedTask,
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to delete task',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Update task status
   * @param {string} id
   * @param {string} status - 'todo', 'in_progress', 'done'
   */
  updateTaskStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.updateTaskStatus(id, status);
      const updatedTask = response.data;
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        myTasks: state.myTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        teamTasks: state.teamTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        selectedTask: state.selectedTask?._id === id ? updatedTask : state.selectedTask,
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to update task status',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Update task progress
   * @param {string} id
   * @param {number} progress - 0-100
   */
  updateTaskProgress: async (id, progress) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.updateTaskProgress(id, progress);
      const updatedTask = response.data;
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        myTasks: state.myTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        teamTasks: state.teamTasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        isLoading: false
      }));
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to update task progress',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Assign task to users
   * @param {string} id
   * @param {Array} assignedTo - Array of user IDs
   */
  assignTask: async (id, assignedTo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.assignTask(id, assignedTo);
      const updatedTask = response.data;
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task._id === id ? updatedTask : task
        ),
        isLoading: false
      }));
      
      // Refresh my tasks
      await get().fetchMyTasks();
      
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to assign task',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Add comment to task
   * @param {string} id
   * @param {string} text
   */
  addComment: async (id, text) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.addComment(id, text);
      
      // Cập nhật selectedTask với data mới từ server (đã populate userId)
      set(state => ({
        selectedTask: state.selectedTask?._id === id
          ? response.data
          : state.selectedTask
      }));
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to add comment',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Add attachment to task
   * @param {string} id
   * @param {FormData} formData
   */
  addAttachment: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.addAttachment(id, formData);
      
      // Refresh task details to get updated attachments
      if (get().selectedTask?._id === id) {
        await get().fetchTaskById(id);
      }
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to add attachment',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch overdue tasks
   * @param {Object} params - Optional parameters
   */
  fetchOverdueTasks: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await taskService.getOverdueTasks(params);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error?.error || 'Failed to fetch overdue tasks',
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Fetch task statistics
   */
  fetchTaskStats: async () => {
    set({ isLoading: true, error: null });
    try {
      // /tasks/stats is a personal current snapshot; it does not accept filters.
      const response = await taskService.getTaskStats();

      set({
        taskStats: response.data,
        isLoading: false
      });

      return response;
    } catch (error) {
      set({
        error: error?.error || 'Failed to fetch task statistics',
        isLoading: false
      });
      throw error;
    }
  },

  /**
   * Set filters
   * @param {Object} newFilters
   */
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters, page: 1 }, page: 1, hasMore: false, listRequestId: state.listRequestId + 1
    }));
  },

  /**
   * Reset filters
   */
  resetFilters: () => {
    set({
      filters: defaultFilters(), listLoading: false, page: 1, pages: 0, total: 0, hasMore: false, listRequestId: get().listRequestId + 1,
      taskBoard: { todo: [], in_progress: [], in_review: [], done: [] }, calendarTasks: [], timelineTasks: [], taskHistory: []
    });
  },

  /**
   * Set selected task
   * @param {Object} task
   */
  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  /**
   * Clear selected task
   */
  clearSelectedTask: () => {
    set({ selectedTask: null });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store
   */
  reset: () => {
    set({
      ...reviewInitialState, boardQuery: null, lastListQuery: null,
      sessionVersion: get().sessionVersion + 1, detailRequestId: get().detailRequestId + 1, advancedLoading: false,
      tasks: [],
      myTasks: [],
      teamTasks: [],
      selectedTask: null,
      taskStats: null,
      isLoading: false,
      error: null,
      filters: defaultFilters(), listLoading: false, page: 1, pages: 0, total: 0, hasMore: false, listRequestId: get().listRequestId + 1,
      taskBoard: { todo: [], in_progress: [], in_review: [], done: [] }, calendarTasks: [], timelineTasks: [], taskHistory: []
    });
  },

  // Local filter functions
  /**
   * Filter tasks by status
   * @param {Array} tasks
   * @param {string} status
   */
  filterByStatus: (tasks, status) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  },

  /**
   * Filter tasks by priority
   * @param {Array} tasks
   * @param {string} priority
   */
  filterByPriority: (tasks, priority) => {
    if (!priority) return tasks;
    return tasks.filter(task => task.priority === priority);
  },

  /**
   * Search tasks by title or description
   * @param {Array} tasks
   * @param {string} searchTerm
   */
  searchTasks: (tasks, searchTerm) => {
    if (!searchTerm) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  },

  /**
   * Get filtered tasks based on current filters
   */
  getFilteredTasks: () => {
    const { tasks, filters, filterByStatus, filterByPriority, searchTasks } = get();
    
    let filtered = [...tasks];
    
    if (filters.status) {
      filtered = filterByStatus(filtered, filters.status);
    }
    
    if (filters.priority) {
      filtered = filterByPriority(filtered, filters.priority);
    }
    
    if (filters.search) {
      filtered = searchTasks(filtered, filters.search);
    }
    
    if (filters.tags?.length) filtered = filtered.filter(task => filters.tags.every(tag => task.tags?.includes(tag)));
    if (filters.fromDate && filters.toDate) {
      const start = new Date(filters.fromDate + 'T00:00:00'), end = new Date(filters.toDate + 'T23:59:59.999');
      filtered = filtered.filter(task => task.dueDate && new Date(task.dueDate) >= start && new Date(task.dueDate) <= end);
    }
    return filtered;
  },

  // ========== SUBTASK OPERATIONS ==========

  /**
   * Create a subtask
   * @param {string} taskId
   * @param {string} title
   */
  createSubtask: async (taskId, title) => {
    try {
      const response = await taskService.createSubtask(taskId, title);
      
      // Update selectedTask if it's the same task
      if (get().selectedTask?._id === taskId) {
        set({ selectedTask: response.data.task });
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle subtask completion
   * @param {string} taskId
   * @param {string} subtaskId
   */
  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const response = await taskService.toggleSubtask(taskId, subtaskId);
      
      // Update selectedTask if it's the same task
      if (get().selectedTask?._id === taskId) {
        set({ selectedTask: response.data.task });
      }
      
      // Update in tasks/myTasks lists
      const updateTaskInLists = (task) => task._id === taskId ? response.data.task : task;
      set(state => ({
        tasks: state.tasks.map(updateTaskInLists),
        myTasks: state.myTasks.map(updateTaskInLists),
        teamTasks: state.teamTasks.map(updateTaskInLists),
      }));
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update subtask
   * @param {string} taskId
   * @param {string} subtaskId
   * @param {Object} updateData
   */
  updateSubtask: async (taskId, subtaskId, updateData) => {
    try {
      const response = await taskService.updateSubtask(taskId, subtaskId, updateData);
      
      if (get().selectedTask?._id === taskId) {
        set({ selectedTask: response.data.task });
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete subtask
   * @param {string} taskId
   * @param {string} subtaskId
   */
  deleteSubtask: async (taskId, subtaskId) => {
    try {
      const response = await taskService.deleteSubtask(taskId, subtaskId);
      
      if (get().selectedTask?._id === taskId) {
        set({ selectedTask: response.data });
      }
      
      // Update in tasks/myTasks lists
      const updateTaskInLists = (task) => task._id === taskId ? response.data : task;
      set(state => ({
        tasks: state.tasks.map(updateTaskInLists),
        myTasks: state.myTasks.map(updateTaskInLists),
        teamTasks: state.teamTasks.map(updateTaskInLists),
      }));
      
      return response;
    } catch (error) {
      throw error;
    }
  },
}));


export default useTaskStore;
