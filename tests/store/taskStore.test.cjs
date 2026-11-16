const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function loadModule(relPath, mocks = {}) {
  const filename = path.resolve(PROJECT_ROOT, relPath);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    configFile: false,
    babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
  }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    return require(name);
  }, mod, mod.exports);
  return mod.exports;
}

test('useTaskStore enforces role-scoped fetchTaskPage and review actions across employee, team_lead, and hr_manager', async () => {
  const calls = [];
  let taskStatus = 'in_progress';
  const taskServiceMock = {
    getMyTasks: async (p) => { calls.push(['my', p]); return { data: [{ _id: 't-my' }], page: 1, pages: 1, total: 1 }; },
    getTeamTasks: async (id, p) => { calls.push(['team', id, p]); return { data: [{ _id: 't-team' }], page: 1, pages: 1, total: 1 }; },
    getAllTasks: async (p) => { calls.push(['all', p]); return { data: [{ _id: 't-all' }], page: 1, pages: 1, total: 1 }; },
    getTaskStats: async () => ({ data: { total: 1 } }),
    getTaskById: async (id) => ({ data: { _id: id, status: taskStatus } }),
    submitForReview: async (id, note) => { calls.push(['submit', id, note]); taskStatus = 'in_review'; return { data: { _id: id, status: taskStatus } }; },
    approveTask: async (id, note) => { calls.push(['approve', id, note]); taskStatus = 'done'; return { data: { _id: id, status: taskStatus } }; },
    requestChanges: async (id, reason) => { calls.push(['requestChanges', id, reason]); taskStatus = 'in_progress'; return { data: { _id: id, status: taskStatus } }; },
  };
  const useTaskStore = loadModule('store/taskStore.js', {
    '../src/services/taskService': taskServiceMock,
    './taskReviewActions': loadModule('store/taskReviewActions.js', {
      '../src/services/taskService': taskServiceMock,
      '../src/utils/taskReviewEvents': { emitTaskReview: () => {} },
    }),
  }).default;

  await useTaskStore.getState().fetchTaskPage('my');
  assert.equal(useTaskStore.getState().myTasks[0]._id, 't-my');

  await useTaskStore.getState().fetchTaskPage('team', { teamId: 'team-a' });
  assert.equal(useTaskStore.getState().teamTasks[0]._id, 't-team');

  await useTaskStore.getState().fetchTaskPage('all');
  assert.equal(useTaskStore.getState().tasks[0]._id, 't-all');

  useTaskStore.setState({ selectedTask: { _id: 't1', status: 'in_progress' } });
  await useTaskStore.getState().submitForReview('t1', 'Ready for QA');
  assert.equal(useTaskStore.getState().selectedTask.status, 'in_review');

  await useTaskStore.getState().approveTask('t1', 'Looks good');
  assert.equal(useTaskStore.getState().selectedTask.status, 'done');

  await useTaskStore.getState().requestChanges('t1', 'Fix edge case');
  assert.equal(useTaskStore.getState().selectedTask.status, 'in_progress');
  assert.equal(calls.filter(([kind]) => ['my', 'team', 'all', 'submit', 'approve', 'requestChanges'].includes(kind)).length, 9);
});

