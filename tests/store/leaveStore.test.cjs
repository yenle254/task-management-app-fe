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

test('useLeaveStore supports submit, approve, reject, cancel, and balance updates across roles', async () => {
  const calls = [];
  const leaveServiceMock = {
    getMyLeaves: async () => ({ data: [{ _id: 'l1', status: 'pending_team_lead', revision: 1 }], pages: 1 }),
    getLeaveBalance: async () => ({ data: { balance: { total: 12, used: 3, remaining: 9 } } }),
    getPendingLeaves: async (p) => { calls.push(['pending', p]); return { data: [{ _id: 'l2', status: 'pending_hr', revision: 2 }] }; },
    submitLeave: async (d) => { calls.push(['submit', d]); return { data: { _id: 'l1', status: 'pending_team_lead' } }; },
    approveLeave: async (id, rev) => { calls.push(['approve', id, rev]); return { data: { _id: id, status: 'approved' } }; },
    rejectLeave: async (id, reason, rev) => { calls.push(['reject', id, reason, rev]); return { data: { _id: id, status: 'rejected' } }; },
    cancelLeave: async (id, rev) => { calls.push(['cancel', id, rev]); return { data: { _id: id, status: 'cancelled' } }; },
  };
  const useLeaveStore = loadModule('store/leaveStore.js', {
    '../src/services/leaveService': leaveServiceMock,
  }).default;

  await useLeaveStore.getState().submitLeave({ type: 'annual', days: 1 });
  assert.equal(useLeaveStore.getState().leaveBalance.remaining, 9);

  await useLeaveStore.getState().fetchPendingLeaves({ step: 'team_lead' });
  assert.equal(useLeaveStore.getState().pendingLeaves.length, 1);

  await useLeaveStore.getState().approveLeave('l2', 2);
  assert.equal(useLeaveStore.getState().pendingLeaves.length, 0);

  await useLeaveStore.getState().rejectLeave('l3', 'Busy sprint', 1);
  await useLeaveStore.getState().cancelLeave('l1', 1);
  assert.deepEqual(calls.map((c) => c[0]), ['submit', 'pending', 'approve', 'reject', 'cancel']);
});

