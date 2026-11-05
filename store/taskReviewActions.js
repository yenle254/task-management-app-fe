import taskService from '../src/services/taskService';
import { emitTaskReview } from '../src/utils/taskReviewEvents';
export const reviewInitialState = { approvals: [], approvalsStats: null, approvalsPage: 1, approvalsPages: 0,
  approvalsLoading: false, approvalsError: null, approvalsQuery: null, approvalsRequestId: 0, reviewBusy: false };
export function taskReviewActions(set, get) {
  const actions = {
    fetchApprovals: async (params = {}) => {
      const session = get().sessionVersion, request = get().approvalsRequestId + 1;
      const current = () => session === get().sessionVersion && request === get().approvalsRequestId;
      set({ approvalsQuery: params, approvalsLoading: true, approvalsError: null, approvalsRequestId: request, approvals: [], approvalsStats: null });
      try {
        const [list, stats] = await Promise.all([taskService.getPendingApproval(params), taskService.getPendingApprovalStats({ teamId: params.teamId })]);
        if (current()) set({ approvals: list.data, approvalsStats: stats.data, approvalsPage: list.page, approvalsPages: list.pages });
      } catch (error) { if (current()) set({ approvalsError: error?.error || error.message || 'Could not load approvals' }); throw error; }
      finally { if (current()) set({ approvalsLoading: false }); }
    }
  };
  for (const operation of ['submitForReview', 'approveTask', 'requestChanges', 'withdrawSubmission', 'reassignReview']) actions[operation] = async (...args) => {
    if (get().reviewBusy) return;
    const session = get().sessionVersion, current = () => get().sessionVersion === session;
    set({ reviewBusy: true });
    const refresh = async () => {
      if (!current()) return;
      const state = get();
      const refreshers = [taskService.getTaskStats().then(response => { if (current()) set({ taskStats: response.data }); })];
      if (state.selectedTask?._id === args[0]) refreshers.push(state.fetchTaskById(args[0]));
      if (state.boardQuery) refreshers.push(state.getBoard(state.boardQuery));
      if (state.lastListQuery) refreshers.push(state.fetchTaskPage(state.lastListQuery.scope, { ...state.lastListQuery.params, page: 1 }));
      if (state.approvalsQuery) refreshers.push(state.fetchApprovals(state.approvalsQuery));
      await Promise.allSettled(refreshers);
      if (current()) emitTaskReview();
    };
    try {
      const response = await taskService[operation](...args);
      if (current()) {
        get().syncTask(response.data);
        set(state => ({ calendarTasks: state.calendarTasks.map(t => t._id === args[0] ? response.data : t),
          timelineTasks: state.timelineTasks.map(t => t._id === args[0] ? response.data : t), taskHistory: [] }));
        await refresh();
      }
      return response;
    } catch (error) { if (error?.status === 409) await refresh(); throw error; }
    finally { if (current()) set({ reviewBusy: false }); }
  };
  return actions;
}
