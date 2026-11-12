const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
function harness(service) {
  const { taskReviewActions, reviewInitialState } = load('store/taskReviewActions.js', {
    '../src/services/taskService': service, '../src/utils/taskReviewEvents': { emitTaskReview() {} }
  });
  let state = { ...reviewInitialState, sessionVersion: 0, calendarTasks: [], timelineTasks: [], syncTask() {} };
  const set = patch => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; };
  Object.assign(state, taskReviewActions(set, () => state));
  return { get: () => state, set };
}
test('review notifications route approvers to inbox and employee decisions to detail', () => {
  const { notificationTarget, inAppEnabled } = load('src/utils/notificationTarget.js');
  assert.equal(notificationTarget({ type: 'task_submitted_for_review', relatedId: 't' }, 'team_lead').screen, 'Approvals');
  assert.equal(notificationTarget({ type: 'task_review_approved', relatedId: 't' }, 'employee').screen, 'TaskDetail');
  assert.equal(notificationTarget({ target: 'task_review_inbox' }, 'employee').screen, 'Notification');
  assert.equal(inAppEnabled({ master: true, categories: { task: { inApp: true, types: { task_review_approved: { inApp: false } } } } }, 'task_review_approved'), false);
});
test('late inbox response cannot repopulate private data after logout', async () => {
  let resolve; const pending = new Promise(done => { resolve = done; });
  const state = harness({ getPendingApproval: () => pending, getPendingApprovalStats: async () => ({ data: { pending: 9 } }) });
  const request = state.get().fetchApprovals(); state.set({ sessionVersion: 1, approvals: [] });
  resolve({ data: [{ _id: 'private' }], page: 1, pages: 1 }); await request;
  assert.deepEqual(state.get().approvals, []);
});
test('double tap sends only one decision and refreshes stats', async () => {
  let resolve, calls = 0; const pending = new Promise(done => { resolve = done; });
  const state = harness({ approveTask: () => { calls++; return pending; }, getTaskStats: async () => ({ data: { in_review: 0 } }) });
  const first = state.get().approveTask('t'); await state.get().approveTask('t'); assert.equal(calls, 1);
  resolve({ data: { _id: 't', status: 'done' } }); await first;
  assert.equal(state.get().taskStats.in_review, 0); assert.equal(state.get().reviewBusy, false);
});
test('409 refreshes detail and stats before surfacing conflict', async () => {
  let refreshed = 0;
  const state = harness({ approveTask: async () => { throw { status: 409, error: 'Changed' }; }, getTaskStats: async () => ({ data: {} }) });
  state.set({ selectedTask: { _id: 't' }, fetchTaskById: async () => { refreshed++; } });
  await assert.rejects(state.get().approveTask('t'), error => error.status === 409);
  assert.equal(refreshed, 1); assert.equal(state.get().reviewBusy, false);
});
