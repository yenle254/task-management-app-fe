/* global __dirname */
// Real HTTP/MongoDB integration with isolated fixtures. No existing database is
// seeded, cleared or changed. Test data stays under dist/dashboard-integration.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { frontendServices } = require('./dashboard-live.cjs');
const projectRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(projectRoot, '../server');
const serverRequire = createRequire(path.join(serverRoot, 'package.json'));
const mongoose = serverRequire('mongoose');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const freePort = () => new Promise((resolve) => {
  const server = net.createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); });
});

async function main() {
  const directory = path.join(projectRoot, 'dist/dashboard-integration', new Date().toISOString().replace(/[:.]/g, '-'));
  const dataDirectory = path.join(directory, 'mongo');
  fs.mkdirSync(dataDirectory, { recursive: true });
  const mongodPath = process.env.DASHBOARD_MONGOD || 'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe';
  assert.ok(fs.existsSync(mongodPath), 'Set DASHBOARD_MONGOD to an installed mongod executable');
  const mongoPort = await freePort();
  const apiPort = await freePort();
  const mongoUri = `mongodb://127.0.0.1:${mongoPort}/dashboard_verification`;
  const baseURL = `http://127.0.0.1:${apiPort}/api`;
  const children = [];
  const logs = [];
  const passed = [];
  let connection, browser, preview;
  const start = (command, args, options) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], ...options });
    children.push(child);
    child.on('error', (error) => logs.push(`${error.code}: ${error.message}`));
    child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
    child.stderr.on('data', (chunk) => logs.push(chunk.toString()));
    return child;
  };
  const check = async (name, fn) => { await fn(); passed.push(name); console.log(`PASS ${name}`); };
  try {
    start(mongodPath, ['--dbpath', dataDirectory, '--port', String(mongoPort), '--bind_ip', '127.0.0.1', '--quiet']);
    connection = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 15000, autoIndex: false, autoCreate: false }).asPromise();
    const db = connection.db;
    assert.equal(db.databaseName, 'dashboard_verification');
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const date = (day, hour = 10) => new Date(base.getFullYear(), base.getMonth(), day, hour);
    const dateString = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    const range = { startDate: dateString(date(1, 0)), endDate: dateString(new Date(base.getFullYear(), base.getMonth() + 1, 0)) };
    const password = `Verification-${crypto.randomBytes(12).toString('hex')}`;
    const passwordHash = await serverRequire('bcryptjs').hash(password, 10);
    const id = () => new mongoose.Types.ObjectId();
    const teamA = id(), teamB = id();
    const makeUser = (name, role, department, teamId = null, isActive = true) => ({
      _id: id(), email: `${name}@dashboard.invalid`, password: passwordHash, role, isActive, teamId,
      profile: { fullName: `Verification ${name}`, employeeId: name, department }, createdAt: date(1, 0), updatedAt: date(1, 0),
      leaveBalance: { [now.getFullYear()]: { total: 20, used: 3, remaining: 17 } },
    });
    const hr = makeUser('hr', 'hr_manager', 'People');
    const lead = makeUser('lead', 'team_lead', 'Engineering', teamA);
    const otherLead = makeUser('other-lead', 'team_lead', 'Support', teamB);
    const employee = makeUser('employee', 'employee', 'Engineering', teamA);
    const peer = makeUser('peer', 'employee', 'Operations', teamA);
    const outsider = makeUser('outsider', 'employee', 'Support', teamB);
    const inactive = makeUser('inactive', 'employee', 'Engineering', teamA, false);
    await db.collection('users').insertMany([hr, lead, otherLead, employee, peer, outsider, inactive]);
    await db.collection('teams').insertMany([
      { _id: teamA, name: 'Verification A', leaderId: lead._id, memberIds: [employee._id, peer._id], createdAt: date(1) },
      { _id: teamB, name: 'Verification B', leaderId: otherLead._id, memberIds: [outsider._id], createdAt: date(1) },
    ]);
    const event = (to, at, dueDate, from = 'todo') => ({ from, to, at, dueDate, teamId: teamA, assignedTo: [employee._id] });
    const makeTask = (title, status, options = {}) => {
      const dueDate = options.dueDate || date(5);
      return { _id: id(), title, status, priority: 'high', teamId: teamA, assignedTo: [employee._id], assignedBy: lead._id,
        createdAt: date(1), updatedAt: date(4), dueDate, progress: status === 'done' ? 100 : 0,
        statusHistory: [event('todo', date(1), dueDate, null)], ...options };
    };
    const tasks = [
      makeTask('On time', 'done', { statusHistory: [event('todo', date(1), date(3), null), event('done', date(2), date(3))] }),
      makeTask('Late', 'done', { statusHistory: [event('todo', date(1), date(2, 8), null), event('done', date(2), date(2, 8))] }),
      makeTask('Legacy without history', 'done', { statusHistory: [] }),
      makeTask('Old deadline', 'todo', { dueDate: date(3) }),
      makeTask('Shared in progress', 'in_progress', { assignedTo: [employee._id, peer._id], dueDate: new Date(now.getTime() + 86400000 * 2) }),
      makeTask('Shared overdue', 'todo', { assignedTo: [employee._id, peer._id] }),
      makeTask('Deleted after completion', 'deleted', { statusHistory: [event('todo', date(1), date(3), null), event('done', date(2), date(3)), event('deleted', date(3), date(3), 'done')] }),
      makeTask('Moved after completion', 'done', { teamId: teamB, assignedTo: [outsider._id], statusHistory: [event('todo', date(1), date(3), null), event('done', date(2), date(3))] }),
      makeTask('Recompleted', 'done', { statusHistory: [event('todo', date(1), date(3), null), event('done', date(2), date(3)), event('todo', date(3), date(3), 'done'), event('done', date(12), date(3))] }),
      makeTask('Earlier cohort', 'todo', { createdAt: new Date(base.getFullYear(), base.getMonth() - 1, 1), statusHistory: [] }),
    ];
    await db.collection('tasks').insertMany(tasks);
    await db.collection('attendances').insertMany([
      { userId: employee._id, date: date(2, 0), clockIn: date(2, 8), clockOut: date(2, 16), workHours: 8, status: 'present' },
      { userId: employee._id, date: date(3, 0), clockIn: date(3, 10), clockOut: date(3, 17), workHours: 7.5, status: 'late' },
      { userId: peer._id, date: date(2, 0), clockIn: date(2, 8), clockOut: date(2, 12), workHours: 4, status: 'present' },
    ]);
    await db.collection('leaves').insertMany([
      { userId: employee._id, status: 'approved', type: 'annual', startDate: date(0), endDate: date(2), numberOfDays: 2, createdAt: date(1) },
      { userId: employee._id, status: 'approved', type: 'annual', startDate: date(5), endDate: date(6), numberOfDays: 2, createdAt: date(1) },
      { userId: peer._id, status: 'approved', type: 'annual', startDate: date(5), endDate: date(6), numberOfDays: 2, createdAt: date(1) },
      { userId: outsider._id, status: 'pending', type: 'annual', startDate: date(5), endDate: date(6), numberOfDays: 2, createdAt: date(1) },
    ]);
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    start(process.execPath, ['-e', "const m=require('mongoose');m.set('autoIndex',false);m.set('autoCreate',false);require('./server');"], {
      cwd: serverRoot,
      env: { ...process.env, MONGO_URL: mongoUri, PORT: String(apiPort), NODE_ENV: 'test', JWT_SECRET: jwtSecret },
    });
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try { ready = (await fetch(`${baseURL.replace('/api', '')}/`)).ok; if (ready) break; } catch { /* startup */ }
      await delay(200);
    }
    assert.ok(ready, 'Isolated backend started');
    const request = async (route, token, status = 200, body) => {
      const response = await fetch(`${baseURL}${route}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
      assert.equal(response.status, status, `${route.split('?')[0]} HTTP status`);
      return response.json();
    };
    const tokens = new Map();
    await check('actual password login, bad password, inactive user and role lookup', async () => {
      for (const user of [hr, lead, otherLead, employee, peer, outsider]) {
        const response = await request('/auth/login', null, 200, { email: user.email, password });
        assert.ok(response.token); assert.equal(response.user.role, user.role); assert.equal(response.user.password, undefined);
        tokens.set(user, response.token);
      }
      await request('/auth/login', null, 401, { email: employee.email, password: `${password}-wrong` });
      await request('/auth/login', null, 401, { email: inactive.email, password });
    });
    const hrClient = frontendServices(tokens.get(hr), baseURL);
    const leadClient = frontendServices(tokens.get(lead), baseURL);
    const employeeClient = frontendServices(tokens.get(employee), baseURL);
    await check('own team and HR access allowed; other lead and employee denied', async () => {
      for (const endpoint of ['performance', 'performance-trends', 'members/progress', 'overdue']) {
        await request(`/teams/${teamA}/${endpoint}`, tokens.get(lead));
        await request(`/teams/${teamA}/${endpoint}`, tokens.get(hr));
        await request(`/teams/${teamA}/${endpoint}`, tokens.get(otherLead), 403);
        await request(`/teams/${teamA}/${endpoint}`, tokens.get(employee), 403);
      }
    });
    await check('team snapshot on-time history coverage, overdue and shared workload', async () => {
      const { data } = await leadClient.team.getPerformance(teamA);
      assert.deepEqual(data.taskCounts, { total: 8, todo: 3, inProgress: 1, done: 4 });
      assert.equal(data.overdueCount, 3); assert.equal(data.onTimeEligibleTasks, 3); assert.equal(data.onTimeTasks, 1); assert.equal(data.onTimeRate, 33.33);
      assert.equal(data.workloadByMember.find((row) => row.userId === employee._id.toString()).openTasks, 4);
      assert.equal(data.workloadByMember.find((row) => row.userId === peer._id.toString()).openTasks, 2);
    });
    await check('date-filtered member progress excludes older cohort without losing shared assignments', async () => {
      const { data } = await leadClient.team.getMemberProgress(teamA, range);
      const row = data.find((member) => member.userId === employee._id.toString());
      assert.equal(row.totalTasks, 7); assert.equal(row.completedTasks, 4); assert.equal(row.overdueTasks, 2); assert.equal(row.onTimeEligibleTasks, 3);
      assert.equal(data.find((member) => member.userId === peer._id.toString()).totalTasks, 2);
    });
    await check('history trend retains moved/deleted events and deduplicates repeated completion', async () => {
      const { data } = await leadClient.team.getPerformanceTrend(teamA, { ...range, period: 'month' });
      assert.equal(data.trend.length, 1);
      assert.equal(data.trend[0].totalTasks, 8); assert.equal(data.trend[0].completedTasks, 5); assert.equal(data.trend[0].completionRate, 62.5);
    });
    await check('overdue pagination reads actual sorted pages without partial aggregates', async () => {
      const first = await leadClient.team.getOverdue(teamA, { page: 1, limit: 2 });
      const second = await leadClient.team.getOverdue(teamA, { page: 2, limit: 2 });
      assert.equal(first.total, 3); assert.equal(first.pages, 2);
      assert.equal(first.data.length, 2); assert.equal(second.data.length, 1);
      assert.equal(new Set([...first.data, ...second.data].map((task) => task._id)).size, 3);
      assert.ok(new Date(first.data[0].dueDate) <= new Date(second.data[0].dueDate));
    });
    await check('HR task cohort/status filtering and department task deduplication', async () => {
      const todo = (await hrClient.statistics.getTaskStats({ ...range, teamId: teamA.toString(), status: 'todo' })).data;
      assert.equal(todo.totalTasks, 2); assert.equal(todo.overdueTasks, 2);
      const done = (await hrClient.statistics.getTaskStats({ ...range, teamId: teamA.toString(), status: 'done' })).data;
      assert.equal(done.totalTasks, 4); assert.equal(done.overdueTasks, 0);
      const peerScope = { ...range, teamId: teamA.toString(), employeeId: peer._id.toString() };
      const peerHigh = (await hrClient.statistics.getTaskStats({ ...peerScope, priority: 'high' })).data;
      assert.equal(peerHigh.totalTasks, 2); assert.equal(peerHigh.overdueTasks, 1);
      const peerLow = (await hrClient.statistics.getTaskStats({ ...peerScope, priority: 'low' })).data;
      assert.equal(peerLow.totalTasks, 0); assert.equal(peerLow.overdueTasks, 0);
      const rows = (await hrClient.statistics.getDepartmentActivity({ ...range, teamId: teamA.toString() })).data;
      assert.deepEqual(rows, [
        { department: 'Engineering', totalTasks: 7, completedTasks: 4, openTasks: 3, overdueTasks: 2 },
        { department: 'Operations', totalTasks: 2, completedTasks: 0, openTasks: 2, overdueTasks: 1 },
      ]);
    });
    await check('nonzero attendance hours, calendar absences and on-time denominator', async () => {
      const report = (await hrClient.statistics.getAttendanceStats(range)).data;
      const legacy = (await hrClient.statistics.getAttendanceStats(base.getMonth() + 1, base.getFullYear())).data;
      let weekdays = 0;
      for (let day = 1; date(day).getMonth() === base.getMonth(); day += 1) {
        if (![0, 6].includes(date(day).getDay())) weekdays += 1;
      }
      const recordedWeekdays = [date(2), date(3), date(2)].filter((day) => ![0, 6].includes(day.getDay())).length;
      const absences = weekdays * 6 - recordedWeekdays;
      assert.equal(report.storedRecords, 3);
      assert.equal(report.calculatedAbsences, absences);
      assert.deepEqual(report.counts, { present: 2, late: 1, absent: absences, total: absences + 3 });
      assert.equal(report.totalWorkHours, 19.5);
      assert.equal(report.onTimeRate, Math.round(2 / (absences + 3) * 10000) / 100);
      assert.equal(report.daily.reduce((sum, row) => sum + row.present + row.late + row.absent, 0), absences + 3);
      assert.deepEqual(legacy.counts, report.counts);
    });
    await check('distinct approved people, actual employee hours/balance and forged identity resistance', async () => {
      const leaves = (await hrClient.statistics.getLeaveStats(range)).data;
      assert.equal(leaves.employeesOnLeave, 2); assert.equal(leaves.approvedLeaveRecords, 3); assert.equal(leaves.pendingLeaves, 1);
      const report = (await employeeClient.employee.getEmployeeDashboard({ ...range, period: 'month' })).data;
      assert.deepEqual(report.tasks, { inProgress: 1, completed: 5, overdue: 3 });
      assert.equal(report.workHours.total, 15.5); assert.equal(report.leaveBalance.remaining, 17);
      const injected = await request(`/employees/dashboard?${new URLSearchParams({ ...range, period: 'month', employeeId: outsider._id.toString() })}`, tokens.get(employee));
      assert.deepEqual(injected.data, report);
    });
    if (process.argv.includes('--browser')) {
      const bundle = 'http://127.0.0.1:8081/tests/dashboard-browser.entry.bundle?platform=web&dev=true&minify=false';
      assert.ok((await fetch(bundle)).ok, 'Start Expo on port 8081 before browser tests');
      preview = http.createServer((req, res) => {
        if (req.url.startsWith('/api/')) {
          const upstream = http.request({ hostname: '127.0.0.1', port: apiPort, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${apiPort}` } }, (response) => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
          upstream.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(upstream); return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex}</style></head><body><div id="root"></div><script src="${bundle}"></script></body></html>`);
      });
      await new Promise((resolve) => preview.listen(0, '127.0.0.1', resolve));
      const origin = `http://127.0.0.1:${preview.address().port}`;
      browser = await serverRequire('playwright').chromium.launch({ headless: true });
      const { expect } = serverRequire('@playwright/test');
      await check('expired persisted session returns to sign-in before mounting Dashboard', async () => {
        const context = await browser.newContext();
        const expired = serverRequire('jsonwebtoken').sign({ id: employee._id.toString() }, jwtSecret, { expiresIn: -1 });
        await context.addInitScript(({ token, user }) => {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }, { token: expired, user: { _id: employee._id.toString(), role: employee.role, profile: employee.profile } });
        const page = await context.newPage();
        await page.goto(origin);
        await expect(page.getByPlaceholder('My Email')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('My dashboard', { exact: true })).toHaveCount(0);
        await context.close();
      });
      for (const [user, heading, width] of [[hr, 'HR dashboard', 1280], [employee, 'My dashboard', 390], [lead, 'Team dashboard', 768]]) {
        await check(`real sign-in and Dashboard browser rendering: ${user.role} at ${width}px`, async () => {
          const context = await browser.newContext({ viewport: { width, height: 900 } });
          const page = await context.newPage();
          const errors = []; page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(origin);
          await page.getByPlaceholder('My Email').fill(user.email);
          await page.getByPlaceholder('My Password').fill(password);
          await page.getByText('Sign In', { exact: true }).last().click();
          await expect(page.getByText(heading, { exact: true })).toBeVisible({ timeout: 20000 });
          await page.getByLabel('Start date, YYYY-MM-DD', { exact: true }).fill(range.startDate);
          await page.getByLabel('End date, YYYY-MM-DD', { exact: true }).fill(range.endDate);
          await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
          await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0, { timeout: 15000 });
          await expect(page.getByRole('button', { name: /^Retry / })).toHaveCount(0);
          if (user === hr) {
            await page.getByLabel('Team', { exact: true }).selectOption(teamA.toString());
            await page.getByLabel('Employee', { exact: true }).selectOption(employee._id.toString());
            await page.getByLabel('Team', { exact: true }).selectOption(teamB.toString());
            await expect(page.getByLabel('Employee', { exact: true })).toHaveValue('');
            await page.getByLabel('Team', { exact: true }).selectOption(teamA.toString());
            await page.route('**/api/statistics/attendance*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Injected verification failure' }) }));
            await page.getByRole('button', { name: 'This week', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Retry Attendance', exact: true })).toBeVisible();
            await expect(page.getByText('Task statistics', { exact: true })).toBeVisible();
            await page.unroute('**/api/statistics/attendance*');
            await page.getByRole('button', { name: 'Retry Attendance', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Retry Attendance', exact: true })).toHaveCount(0);
            await page.getByRole('button', { name: 'Last month', exact: true }).click();
            await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
            let release, signalStarted;
            const held = new Promise((resolve) => { release = resolve; });
            const started = new Promise((resolve) => { signalStarted = resolve; });
            const currentStart = dateString(new Date(now.getFullYear(), now.getMonth(), 1));
            await page.route('**/api/statistics/tasks*', async (route) => {
              if (new URL(route.request().url()).searchParams.get('startDate') === currentStart) { signalStarted(); await held; }
              await route.continue();
            });
            await page.getByRole('button', { name: 'This month', exact: true }).click();
            await started;
            await page.getByRole('button', { name: 'Last month', exact: true }).click();
            const lateResponse = page.waitForResponse((response) => response.url().includes('/statistics/tasks') && new URL(response.url()).searchParams.get('startDate') === currentStart);
            release(); await lateResponse;
            await expect(page.getByText('Task statistics', { exact: true }).locator('..').getByText('7', { exact: true })).toBeVisible();
            await page.unroute('**/api/statistics/tasks*');
            await page.getByLabel('Start date, YYYY-MM-DD', { exact: true }).fill(range.endDate);
            await page.getByLabel('End date, YYYY-MM-DD', { exact: true }).fill(range.startDate);
            await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
            await expect(page.getByRole('alert')).toHaveText('Start date must not be after end date.');
            await page.getByLabel('Start date, YYYY-MM-DD', { exact: true }).fill(range.startDate);
            await page.getByLabel('End date, YYYY-MM-DD', { exact: true }).fill(range.endDate);
            await page.getByRole('button', { name: 'Apply dates', exact: true }).focus();
            await page.keyboard.press('Enter');
            await expect(page.getByRole('alert')).toHaveCount(0);
          }
          if (user === employee) {
            await expect(page.getByText('15.5 h', { exact: true })).toBeVisible();
            await expect(page.getByLabel('Team', { exact: true })).toHaveCount(0);
          }
          await page.screenshot({ path: path.join(directory, `${user.role}-${width}.png`), fullPage: true });
          await page.getByText(user === lead ? 'Completion trend' : 'Performance trend', { exact: true }).scrollIntoViewIfNeeded();
          await expect(page.locator('svg path[d*="NaN"]')).toHaveCount(0);
          assert.ok(await page.locator('svg path').count() > 10, 'Charts rendered SVG paths');
          await page.screenshot({ path: path.join(directory, `${user.role}-${width}-charts.png`), fullPage: true });
          if (user === employee) {
            const expired = serverRequire('jsonwebtoken').sign({ id: employee._id.toString() }, jwtSecret, { expiresIn: -1 });
            await page.evaluate((token) => localStorage.setItem('authToken', token), expired);
            await page.getByRole('button', { name: 'This week', exact: true }).click();
            await expect(page.getByPlaceholder('My Email')).toBeVisible({ timeout: 10000 });
            await expect(page.getByText('My dashboard', { exact: true })).toHaveCount(0);
          }
          assert.deepEqual(errors, []);
          await context.close();
        });
      }
    }
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify({ executedAt: new Date().toISOString(), passed, fixtureDatabase: mongoUri, existingDatabaseWrites: 0, browserHarness: process.argv.includes('--browser') }, null, 2));
    console.log(JSON.stringify({ passed: passed.length, artifacts: directory, existingDatabaseWrites: 0 }));
  } finally {
    if (browser) await browser.close();
    if (preview) await new Promise((resolve) => preview.close(resolve));
    if (connection) await connection.close();
    for (const child of children.reverse()) if (child.exitCode === null) child.kill();
    fs.writeFileSync(path.join(directory, 'process.log'), logs.join(''));
  }
}
main().catch((error) => { console.error(error.name, error.message); process.exitCode = 1; });
