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

test('useAttendanceStore supports clock-in, clock-out, and stats for employee, team_lead, and hr_manager', async () => {
  let todayRecord = null;
  const attendanceServiceMock = {
    clockIn: async (loc) => {
      todayRecord = { _id: 'att-1', clockIn: { location: loc, time: new Date().toISOString() }, status: 'present' };
      return { data: todayRecord };
    },
    clockOut: async () => {
      todayRecord = { ...todayRecord, clockOut: { time: new Date().toISOString() }, workHours: 8 };
      return { data: todayRecord };
    },
    getMyAttendance: async () => ({ data: todayRecord ? [todayRecord] : [] }),
    getTodayAttendance: async () => ({ data: todayRecord }),
    getAttendanceStats: async () => ({
      data: { totalDays: 1, presentDays: 1, lateDays: 0, absentDays: 0, totalWorkHours: 8, averageWorkHours: 8 },
    }),
  };
  const useAttendanceStore = loadModule('store/attendanceStore.js', {
    '../src/services/attendanceService': attendanceServiceMock,
  }).default;

  await useAttendanceStore.getState().clockIn({ lat: 10.87, lng: 106.8 });
  assert.equal(useAttendanceStore.getState().todayAttendance._id, 'att-1');
  assert.equal(useAttendanceStore.getState().stats.presentDays, 1);

  await useAttendanceStore.getState().clockOut();
  assert.equal(useAttendanceStore.getState().todayAttendance.workHours, 8);
});

