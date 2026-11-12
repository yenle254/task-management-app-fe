/* global __dirname */
// Explicit, read-only integration check against the configured database and a
// running backend. Never seeds users/tasks, changes credentials, or prints tokens.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const projectRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(projectRoot, '../server');
const serverRequire = createRequire(path.join(serverRoot, 'package.json'));
const babel = require('@babel/core');

function frontendServices(token, baseURL) {
  const cache = new Map();
  const storage = new Map([['authToken', token]]);
  const mocks = {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      removeItem: async (key) => storage.delete(key),
    },
  };
  function load(filename) {
    const absolute = path.resolve(projectRoot, filename);
    if (absolute === path.join(projectRoot, 'src/config/api.config.js')) return { default: { BASE_URL: baseURL, TIMEOUT: 10000 }, __esModule: true };
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loaded = { exports: {} };
    cache.set(absolute, loaded);
    const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
      filename: absolute, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
    const localRequire = (name) => mocks[name] || (name.startsWith('.')
      ? load(path.resolve(path.dirname(absolute), name.endsWith('.js') ? name : `${name}.js`)) : require(name));
    new Function('require', 'module', 'exports', code)(localRequire, loaded, loaded.exports);
    return loaded.exports;
  }
  return {
    statistics: load('src/services/statisticsService.js').default,
    employee: load('src/services/employeeDashboardService.js').default,
    team: load('src/services/teamService.js').default,
    data: load('src/utils/dashboardData.js'),
    filters: load('src/utils/dashboardFilters.js'),
  };
}

async function run() {
  const env = serverRequire('dotenv').parse(fs.readFileSync(path.join(serverRoot, '.env')));
  const mongoose = serverRequire('mongoose');
  const jwt = serverRequire('jsonwebtoken');
  const baseURL = process.env.DASHBOARD_API_URL || `http://127.0.0.1:${env.PORT || 3000}/api`;
  assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+\/api$/.test(baseURL), 'Only a local verification server is supported');
  const connection = await mongoose.createConnection(env.MONGO_URL, { serverSelectionTimeoutMS: 7000, autoIndex: false, autoCreate: false }).asPromise();
  const passed = [];
  const limitations = [];
  const check = (name, fn) => Promise.resolve().then(fn).then(() => { passed.push(name); console.log(`PASS ${name}`); });
  try {
    const db = connection.db;
    const users = await db.collection('users').find({}, { projection: { _id: 1, role: 1, isActive: 1, createdAt: 1, teamId: 1, 'profile.department': 1, leaveBalance: 1 } }).toArray();
    const hr = users.find((user) => user.role === 'hr_manager' && user.isActive);
    const employee = users.find((user) => user.role === 'employee' && user.isActive);
    assert.ok(hr && employee, 'Existing active HR and employee accounts are required');
    // These short-lived verification sessions exercise real JWT verification and
    // database role lookup. They do not establish password-login acceptance.
    const sign = (user, expiresIn = '5m') => jwt.sign({ id: user._id.toString() }, env.JWT_SECRET, { expiresIn });
    const hrToken = sign(hr);
    const employeeToken = sign(employee);
    const client = frontendServices(hrToken, baseURL);
    const employeeClient = frontendServices(employeeToken, baseURL);
    const range = client.filters.presetRange('month');
    const start = new Date(`${range.startDate}T00:00:00`);
    const end = new Date(`${range.endDate}T23:59:59.999`);
    const get = async (route, token, status = 200) => {
      const response = await fetch(`${baseURL}${route}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(10000) });
      assert.equal(response.status, status, `${route.split('?')[0]} HTTP status`);
      const body = await response.json();
      assert.equal(body.success, status < 400);
      return body;
    };
    const query = new URLSearchParams(range).toString();
    const taskCount = await db.collection('tasks').countDocuments();
    const teamCount = await db.collection('teams').countDocuments();
    const attendanceCount = await db.collection('attendances').countDocuments();
    const leaveCount = await db.collection('leaves').countDocuments();
    const counts = { users: users.length, tasks: taskCount, teams: teamCount, attendance: attendanceCount, leaves: leaveCount };

    await check('missing, malformed and expired sessions rejected', async () => {
      await get('/statistics/overview', null, 401);
      await get('/employees/dashboard', 'invalid-token', 401);
      await get('/employees/dashboard', sign(employee, -1), 401);
    });
    await check('signed existing identities resolved by actual authentication middleware', async () => {
      assert.equal((await get('/auth/me', hrToken)).data._id, hr._id.toString());
      assert.equal((await get('/auth/me', employeeToken)).data._id, employee._id.toString());
    });
    await check('employee denied every HR Dashboard endpoint', async () => {
      for (const route of ['overview', 'employees-by-department', 'department-activity', 'attendance', 'leaves', 'tasks', 'team-performance', 'performance-trends']) await get(`/statistics/${route}`, employeeToken, 403);
    });
    await check('HR denied employee-only Dashboard endpoints', async () => {
      await get('/employees/dashboard', hrToken, 403); await get('/employees/tasks', hrToken, 403);
    });
    await check('real frontend apiClient and overview service match database counts', async () => {
      const data = client.data.responseData(await client.statistics.getOverviewStats());
      assert.equal(data.totalEmployees, users.filter((user) => user.isActive).length);
      assert.equal(data.totalTeams, teamCount);
      assert.equal(data.totalTasks, await db.collection('tasks').countDocuments({ status: { $ne: 'deleted' } }));
      assert.equal(data.pendingLeaves, await db.collection('leaves').countDocuments({ status: 'pending' }));
    });
    await check('task status/priority/employee/date filters and overdue calculations match database', async () => {
      for (const status of [undefined, 'todo', 'in_progress', 'done']) {
        const filters = { ...range, status, employeeId: employee._id.toString(), priority: 'high' };
        const data = client.data.responseData(await client.statistics.getTaskStats(filters));
        const match = { createdAt: { $gte: start, $lte: end }, assignedTo: employee._id, priority: 'high', status: status || { $ne: 'deleted' } };
        assert.equal(data.totalTasks, await db.collection('tasks').countDocuments(match));
        const open = !status || ['todo', 'in_progress'].includes(status);
        assert.equal(data.overdueTasks, open ? await db.collection('tasks').countDocuments({ ...match, status: status || { $in: ['todo', 'in_progress'] }, dueDate: { $ne: null, $lt: new Date() } }) : 0);
      }
      const legacy = client.data.responseData(await client.statistics.getTaskStats());
      assert.equal(legacy.totalTasks, await db.collection('tasks').countDocuments({ status: { $ne: 'deleted' } }));
    });
    await check('department headcount matches active profile departments', async () => {
      const rows = client.data.responseRecords(await client.statistics.getEmployeesByDepartment());
      const expected = new Map();
      for (const user of users.filter((user) => user.isActive)) {
        const department = user.profile?.department || 'Unassigned';
        expected.set(department, (expected.get(department) || 0) + 1);
      }
      assert.deepEqual(rows.slice().sort((a, b) => a.department.localeCompare(b.department)), [...expected].map(([department, count]) => ({ department, count })).sort((a, b) => a.department.localeCompare(b.department)));
    });
    await check('HR attendance dates, legacy month/year and denominator match actual records', async () => {
      const data = client.data.responseData(await client.statistics.getAttendanceStats(range));
      const legacy = client.data.responseData(await client.statistics.getAttendanceStats(start.getMonth() + 1, start.getFullYear()));
      assert.deepEqual(data.counts, legacy.counts);
      const rows = await db.collection('attendances').find({ date: { $gte: start, $lte: end }, status: { $in: ['present', 'late', 'absent'] } }).toArray();
      assert.equal(data.storedRecords, rows.length);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let absences = 0;
      for (const user of users.filter((user) => user.isActive && ['employee', 'team_lead', 'hr_manager'].includes(user.role))) {
        const joined = new Date(user.createdAt); joined.setHours(0, 0, 0, 0);
        for (let day = new Date(start); day <= end && day < today; day.setDate(day.getDate() + 1)) {
          if (day < joined || [0, 6].includes(day.getDay())) continue;
          if (!rows.some((row) => row.userId.toString() === user._id.toString() && new Date(row.date).toDateString() === day.toDateString())) absences += 1;
        }
      }
      assert.equal(data.calculatedAbsences, absences);
      assert.equal(data.totalRecords, rows.length + absences);
      const present = rows.filter((row) => row.status === 'present').length;
      assert.equal(data.onTimeRate, data.totalRecords ? Math.round(present / data.totalRecords * 10000) / 100 : 0);
      assert.equal(data.daily.reduce((sum, row) => sum + row.present + row.late + row.absent, 0), data.totalRecords);
    });
    await check('approved leave counts distinct people overlapping dates, not requests', async () => {
      const data = client.data.responseData(await client.statistics.getLeaveStats(range));
      const people = await db.collection('leaves').distinct('userId', { status: 'approved', startDate: { $lte: end }, endDate: { $gte: start } });
      assert.equal(data.employeesOnLeave, people.length);
      assert.equal(data.pendingLeaves, await db.collection('leaves').countDocuments({ status: 'pending' }));
    });
    await check('department/task-history aggregates and team pagination execute on actual MongoDB', async () => {
      const activity = client.data.responseRecords(await client.statistics.getDepartmentActivity(range));
      const teams = await client.data.collectPages((page) => client.team.getAllTeams({ page, limit: 100 }), true);
      assert.equal(teams.length, teamCount);
      const performance = client.data.responseRecords(await client.statistics.getTeamPerformance(range));
      const weekly = client.data.responseData(await client.statistics.getPerformanceTrends({ ...range, period: 'week' }));
      const monthly = client.data.responseData(await client.statistics.getPerformanceTrends({ ...range, period: 'month' }));
      assert.ok(Array.isArray(weekly.trend) && Array.isArray(monthly.trend));
      if (!taskCount) { assert.deepEqual(activity, []); assert.deepEqual(weekly.trend, []); assert.deepEqual(monthly.trend, []); }
      if (!teamCount) assert.deepEqual(performance, []);
    });
    await check('employee data, full pagination and identity query resistance', async () => {
      const data = employeeClient.data.responseData(await employeeClient.employee.getEmployeeDashboard({ ...range, period: 'week' }));
      const injected = await get(`/employees/dashboard?${query}&period=week&employeeId=${hr._id}&userId=${hr._id}`, employeeToken);
      assert.deepEqual(injected.data, data);
      assert.equal(data.tasks.inProgress, await db.collection('tasks').countDocuments({ assignedTo: employee._id, status: 'in_progress' }));
      const rows = await db.collection('attendances').find({ userId: employee._id, date: { $gte: start, $lte: end }, workHours: { $type: 'number', $gte: 0 } }).toArray();
      assert.equal(data.workHours.total, Math.round(rows.reduce((sum, row) => sum + row.workHours, 0) * 100) / 100);
      const tasks = await employeeClient.data.collectPages((page) => employeeClient.employee.getTasks({ ...range, page, limit: 100 }));
      assert.equal(tasks.length, await db.collection('tasks').countDocuments({ assignedTo: employee._id, createdAt: { $gte: start, $lte: end }, status: { $ne: 'deleted' } }));
    });
    await check('invalid date, grouping, ID, status and priority filters rejected', async () => {
      for (const route of ['/statistics/tasks?status=deleted', '/statistics/tasks?priority=invalid', '/statistics/tasks?teamId=invalid', '/statistics/attendance?startDate=2026-02-30&endDate=2026-03-01', '/statistics/department-activity?startDate=2026-01-01', '/statistics/performance-trends?period=year']) await get(route, hrToken, 400);
      await get('/employees/dashboard?startDate=2026-03-02&endDate=2026-03-01', employeeToken, 400);
    });
    if (!teamCount) await check('missing team returns 404 to HR; employee denied team Dashboard routes', async () => {
      const missing = new mongoose.Types.ObjectId();
      for (const route of ['performance', 'performance-trends', 'members/progress', 'overdue']) {
        await get(`/teams/${missing}/${route}`, hrToken, 404);
        await get(`/teams/${missing}/${route}`, employeeToken, 403);
      }
    });
    limitations.push('Successful password login was not exercised; short-lived locally signed sessions for existing users were used.');
    if (!users.some((user) => user.role === 'team_lead' && user.isActive) || !teamCount) limitations.push('No existing active team lead/team: valid own-team and cross-team live cases unavailable.');
    if (!taskCount) limitations.push('No stored tasks: nonzero task, overdue, trend and department activity calculations need isolated fixtures or representative existing data.');
    const report = { executedAt: new Date().toISOString(), database: { local: ['127.0.0.1', 'localhost'].includes(connection.host), counts }, passed, limitations, writes: 0 };
    const directory = path.join(projectRoot, 'dist/dashboard-live');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'api-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ passed: passed.length, ...report.database, limitations }));
    return report;
  } finally { await connection.close(); }
}

module.exports = { run, frontendServices };
if (require.main === module) {
  if (!process.argv.includes('--run')) throw new Error('Use --run to explicitly enable read-only live Dashboard checks.');
  run().catch((error) => { console.error(error.name, error.message); process.exitCode = 1; });
}
