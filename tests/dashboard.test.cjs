/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

// Use installed Babel with Node's test runner; no new runtime/test dependencies.
function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(__dirname, '..', filename);
    if (Object.hasOwn(mocks, absolute)) return mocks[absolute];
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
      filename: absolute, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
    }).code;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('.svg')) return () => null;
      return name.startsWith('.') ? load(path.resolve(path.dirname(absolute), name.endsWith('.js') ? name : `${name}.js`)) : require(name);
    };
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const load = loader();
const f = load('src/utils/dashboardFilters.js');
const d = load('src/utils/dashboardData.js');
const { createDashboardResource } = load('store/dashboardResource.js');
const range = { startDate: '2026-09-01', endDate: '2026-10-22' };

test('401 invalidates the matching session but preserves a newer account session', async () => {
  const values = new Map([['authToken', 'new-token'], ['user', 'new-user']]);
  let rejectResponse;
  const authLoad = loader({
    axios: { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: (_, reject) => { rejectResponse = reject; } } } }) },
    'react-native': { Platform: { OS: 'web' } },
    'expo-secure-store': {},
    '@react-native-async-storage/async-storage': { getItem: async key => values.get(key), setItem: async (key, value) => values.set(key, value), removeItem: async key => values.delete(key), multiRemove: async keys => keys.forEach(key => values.delete(key)) },
    [path.resolve(__dirname, '../src/config/runtime-api.config.js')]: { BASE_URL: 'http://localhost/api', TIMEOUT: 1000 },
  });
  const api = authLoad('src/services/api.js');
  const authStorage = authLoad('src/utils/authStorage.js');
  let expired = 0;
  const unsubscribe = api.subscribeSessionExpired(() => { expired += 1; });
  const error = (token) => ({ response: { status: 401, data: { error: 'expired' } }, config: { url: '/dashboard', _retry: true, _accessToken: token, _authGeneration: 0, headers: { Authorization: `Bearer ${token}` } } });
  await assert.rejects(rejectResponse(error('old-token')));
  assert.equal(await authStorage.getToken(), 'new-token'); assert.equal(expired, 0);
  await assert.rejects(rejectResponse(error('new-token')));
  assert.equal(await authStorage.getToken(), null); assert.equal(values.has('user'), false); assert.equal(expired, 1);
  unsubscribe();
});

test('dates reject incomplete, inverted, malformed and overflowing ranges', () => {
  for (const value of [{ startDate: '2026-01-01' }, { startDate: '2026-02-30', endDate: '2026-03-01' }, { startDate: '2026-02-02', endDate: '2026-02-01' }, { startDate: '10/22/2026', endDate: '2026-10-22' }]) assert.throws(() => f.dateRange(value));
  assert.deepEqual(f.dateRange({ startDate: '2024-02-29', endDate: '2024-02-29' }), { startDate: '2024-02-29', endDate: '2024-02-29' });
});
test('calendar filters normalize numeric strings and explicit dates win', () => {
  assert.deepEqual(f.calendarParams({ month: '9', year: '2026' }), { month: 9, year: 2026 });
  assert.deepEqual(f.calendarParams({ month: 1, year: 2025, ...range }), range);
  for (const month of [0, 13, 1.5, 'oops']) assert.throws(() => f.calendarParams({ month }));
});
test('task filters omit blank/unknown fields and support one-sided ranges', () => {
  assert.deepEqual(f.taskParams({ teamId: '', employeeId: null, status: undefined, extra: 5 }), {});
  assert.deepEqual(f.taskParams({ startDate: '2026-01-01', priority: 'high' }), { startDate: '2026-01-01', priority: 'high' });
});
test('presets use local calendar and Monday weeks across year boundaries', () => {
  assert.deepEqual(f.presetRange('week', new Date(2026, 0, 1)), { startDate: '2025-12-29', endDate: '2026-01-04' });
  assert.deepEqual(f.presetRange('previous', new Date(2026, 0, 1)), { startDate: '2025-12-01', endDate: '2025-12-31' });
  assert.deepEqual(f.presetRange('month', new Date(2024, 1, 29)), { startDate: '2024-02-01', endDate: '2024-02-29' });
});
test('changing team clears the old employee immediately', () => {
  assert.deepEqual(f.changeTeam({ ...range, teamId: 'old', employeeId: 'person' }, 'new'), { ...range, teamId: 'new', employeeId: '' });
});
function services() {
  const calls = [];
  const api = { get: async (url, config) => { calls.push({ url, params: config?.params }); return { success: true, data: {} }; } };
  const scopedLoad = loader({ [path.resolve(__dirname, '../src/services/api.js')]: api });
  return { calls, statistics: scopedLoad('src/services/statisticsService.js').default, employee: scopedLoad('src/services/employeeDashboardService.js').default, team: scopedLoad('src/services/teamService.js').default, scopedLoad };
}
test('legacy statistics calls keep their endpoint and argument order', async () => {
  const { calls, statistics: s } = services();
  await s.getTaskStats(); await s.getAttendanceStats(9, 2026); await s.getLeaveStats(2026); await s.getLeaveStats(2026, 9);
  assert.deepEqual(calls, [
    { url: '/statistics/tasks', params: {} }, { url: '/statistics/attendance', params: { month: 9, year: 2026 } },
    { url: '/statistics/leaves', params: { year: 2026 } }, { url: '/statistics/leaves', params: { month: 9, year: 2026 } },
  ]);
});
test('statistics services only send filters supported by each endpoint', async () => {
  const { calls, statistics: s } = services();
  const input = { ...range, teamId: 'team', employeeId: 'employee', status: 'done', priority: 'high', period: 'week' };
  await s.getAttendanceStats(input); await s.getLeaveStats(input); await s.getPerformanceTrends(input); await s.getTeamPerformance(input); await s.getEmployeesByDepartment(input); await s.getTaskStats(input);
  assert.deepEqual(calls[0].params, range); assert.deepEqual(calls[1].params, range);
  assert.deepEqual(calls[2].params, { ...range, teamId: 'team', employeeId: 'employee', period: 'week' });
  assert.deepEqual(calls[3].params, { ...range, teamId: 'team', employeeId: 'employee' });
  assert.deepEqual(calls[4].params, { teamId: 'team', employeeId: 'employee' });
  assert.deepEqual(calls[5].params, { ...range, teamId: 'team', employeeId: 'employee', status: 'done', priority: 'high' });
  await s.getDepartmentActivity(input);
  assert.deepEqual(calls[6], { url: '/statistics/department-activity', params: { ...range, teamId: 'team', employeeId: 'employee' } });
});
test('old four-argument attendance call and object ranges send no conflicting month/year', async () => {
  const { calls, statistics: s } = services();
  await s.getAttendanceStats(1, 2025, range.startDate, range.endDate); await s.getLeaveStats(2025, 1, range.startDate, range.endDate);
  assert.deepEqual(calls.map((call) => call.params), [range, range]);
});
test('invalid range is rejected before making any request', () => {
  const { calls, statistics: s } = services();
  assert.throws(() => s.getAttendanceStats({ startDate: '2026-10-10' }));
  assert.throws(() => s.getPerformanceTrends({ period: 'year' }));
  assert.equal(calls.length, 0);
});
test('employee service never sends another identity or team', async () => {
  const { calls, employee } = services();
  await employee.getEmployeeDashboard({ ...range, period: 'week', employeeId: 'other', teamId: 'other' });
  await employee.getTasks({ ...range, employeeId: 'other', page: 2, limit: 100 });
  assert.deepEqual(calls, [{ url: '/employees/dashboard', params: { ...range, period: 'week' } }, { url: '/employees/tasks', params: { ...range, page: 2, limit: 100 } }]);
});
test('team lead endpoints use team authorization and endpoint-specific filters', async () => {
  const { calls, team } = services();
  await team.getMemberProgress('mine', { ...range, employeeId: 'other' }); await team.getPerformance('mine', range); await team.getPerformanceTrend('mine', { ...range, period: 'week', teamId: 'other', employeeId: 'other' }); await team.getOverdue('mine', { ...range, page: 2, limit: 10 });
  assert.deepEqual(calls, [{ url: '/teams/mine/members/progress', params: range }, { url: '/teams/mine/performance', params: undefined }, { url: '/teams/mine/performance-trends', params: { ...range, period: 'week' } }, { url: '/teams/mine/overdue', params: { page: 2, limit: 10 } }]);
});
test('zero remains zero; missing fields, strings and invalid numbers are not coerced', () => {
  assert.equal(d.displayNumber(0, '%'), '0%');
  for (const value of [undefined, null, '0', NaN, Infinity, -1]) assert.equal(d.displayNumber(value), 'Not available');
  assert.throws(() => d.responseData({ success: false, data: {} }));
  assert.throws(() => d.responseData({ success: true }));
});
test('task status aggregates use complete records and reject unknown statuses', () => {
  assert.deepEqual(d.countTaskStatuses([{ status: 'todo' }, { status: 'done' }, { status: 'todo' }]), [{ _id: 'todo', count: 2 }, { _id: 'in_progress', count: 0 }, { _id: 'in_review', count: 0 }, { _id: 'done', count: 1 }]);
  assert.equal(d.countTaskStatuses([{ status: 'unexpected' }]), null);
});
test('overdue excludes completed tasks and preserves less-than-one-day as zero', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  assert.equal(d.daysOverdue({ status: 'todo', dueDate: '2026-10-22T11:00:00Z' }, now), 0);
  assert.equal(d.daysOverdue({ status: 'in_progress', dueDate: '2026-10-20T11:00:00Z' }, now), 2);
  assert.equal(d.daysOverdue({ status: 'done', dueDate: '2026-10-20T11:00:00Z' }, now), null);
  assert.equal(d.daysOverdue({ status: 'todo', dueDate: 'invalid' }, now), null);
});
test('pagination reads all pages before returning any task aggregate', async () => {
  const pages = [];
  const result = await d.collectPages(async (page) => { pages.push(page); return { success: true, data: [{ _id: String(page) }], total: 3, page, pages: 3 }; });
  assert.deepEqual(pages, [1, 2, 3]); assert.equal(result.length, 3);
});
test('team pagination uses nested total pages and supports empty data', async () => {
  const result = await d.collectPages(async (page) => ({ success: true, data: [], pagination: { current: page, total: 0, totalRecords: 0 } }), true);
  assert.deepEqual(result, []);
});
test('pagination rejects partial failures, duplicate rows and changing totals', async () => {
  await assert.rejects(d.collectPages(async (page) => { if (page === 2) throw new Error('offline'); return { success: true, data: [{ _id: 'a' }], total: 2, page, pages: 2 }; }), /offline/);
  await assert.rejects(d.collectPages(async (page) => ({ success: true, data: [{ _id: 'a' }], total: 2, page, pages: 2 })), /changed/);
  await assert.rejects(d.collectPages(async (page) => ({ success: true, data: [{ _id: String(page) }], total: page === 1 ? 2 : 3, page, pages: 2 })), /changed/);
});
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
test('late response cannot overwrite a newer filter', async () => {
  const resource = createDashboardResource(); const old = deferred();
  const pending = resource.load('old', () => old.promise);
  await resource.load('new', async () => 9); old.resolve(1); await pending;
  assert.equal(resource.store.getState().key, 'new'); assert.equal(resource.store.getState().data, 9);
});
test('late errors cannot hide a new result and unmount cancels publication', async () => {
  const resource = createDashboardResource(); const old = deferred();
  const pending = resource.load('old', () => old.promise);
  await resource.load('new', async () => 9); old.reject(new Error('old failure')); await pending;
  assert.equal(resource.store.getState().status, 'ready');
  const later = deferred(); const waiting = resource.load('later', () => later.promise); resource.cancel(); later.resolve(5); await waiting;
  assert.equal(resource.store.getState().data, null);
});
test('cache deduplicates in-flight requests, is scoped by filters, and supports refresh', async () => {
  const resource = createDashboardResource(); let calls = 0;
  const fetcher = async () => ++calls;
  await Promise.all([resource.load('same', fetcher), resource.load('same', fetcher)]);
  await resource.load('same', fetcher); assert.equal(calls, 1);
  await resource.load('different', fetcher); assert.equal(calls, 2);
  await resource.load('same', fetcher, true); assert.equal(calls, 3);
  const anotherUser = createDashboardResource(); await anotherUser.load('same', fetcher); assert.equal(calls, 4);
});
test('one section can fail and retry without affecting another or becoming a false zero', async () => {
  const broken = createDashboardResource(); const good = createDashboardResource();
  await Promise.all([broken.load('a', async () => { throw new Error('offline'); }), good.load('b', async () => 0)]);
  assert.equal(broken.store.getState().status, 'error'); assert.equal(broken.store.getState().data, null);
  assert.equal(good.store.getState().data, 0);
  await broken.load('a', async () => 3, true); assert.equal(broken.store.getState().data, 3);
});

// Render the real dashboard components with lightweight native host adapters.
// This tests UI branches/requests, not device layout or native chart rendering.
function renderDashboard(filename, { role, teamId, width = 390, states = [], exportName = 'default', props = {} } = {}) {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const requests = [];
  const calls = [];
  const events = [];
  const host = (tag) => {
    const Host = (values) => {
      events.push(values);
      const { children, style, accessibilityLabel, disabled } = values;
      return React.createElement(tag, { 'data-style': JSON.stringify(style), 'aria-label': accessibilityLabel, disabled }, children);
    };
    return Host;
  };
  const native = {
    View: host('div'), Text: host('span'), ScrollView: host('div'), Pressable: host('button'), TextInput: host('input'),
    Modal: host('div'), TouchableOpacity: host('button'),
    StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ width, height: 844 }),
  };
  const Picker = host('select');
  function PickerItem({ label, value }) { return React.createElement('option', { value }, label); }
  Picker.Item = PickerItem;
  let resourceIndex = 0;
  const useResource = (key, fetcher, enabled = true) => {
    if (enabled) requests.push(Promise.resolve().then(fetcher));
    return { status: 'ready', data: {}, reload: () => {}, ...states[resourceIndex++] };
  };
  const api = { get: async (url, options) => {
    calls.push({ url, params: options?.params });
    if (url === '/teams') return { success: true, data: [], pagination: { current: 1, total: 0, totalRecords: 0 } };
    if (url === '/employees/tasks') return { success: true, data: [], page: 1, pages: 0, total: 0 };
    if (url.endsWith('/overdue')) return { success: true, data: [], page: 1, pages: 0, total: 0 };
    if (['/statistics/team-performance', '/statistics/employees-by-department', '/statistics/department-activity'].includes(url) || url.endsWith('/members/progress')) return { success: true, data: [] };
    return { success: true, data: {} };
  } };
  const scopedLoad = loader({
    'react-native': native,
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'react-native-chart-kit': { BarChart: host('div'), LineChart: host('div'), PieChart: host('div') },
    '@react-native-picker/picker': { Picker },
    [path.resolve(__dirname, '../src/services/api.js')]: api,
    [path.resolve(__dirname, '../src/contexts/authContext.js')]: { useAuth: () => ({ user: { _id: 'self', role, teamId } }) },
    [path.resolve(__dirname, '../src/hooks/useDashboardResource.js')]: { __esModule: true, default: useResource, useDashboardRefresh: () => {} },
  });
  const html = renderToStaticMarkup(React.createElement(scopedLoad(filename)[exportName], props));
  return { html, calls, events, complete: () => Promise.all(requests) };
}
test('employee UI renders zero and unavailable values without exposing identity filters', async () => {
  const rendered = renderDashboard('src/components/home/dashboard/employeeDashboardContent.js', {
    role: 'employee', states: [{ data: { tasks: { inProgress: 0, completed: 2, overdue: 0 }, workHours: { total: 0 }, leaveBalance: {}, performanceTrend: [] } }, { data: [] }, { data: [] }],
  });
  await rendered.complete();
  assert.match(rendered.html, /My dashboard/); assert.match(rendered.html, /0 h/); assert.match(rendered.html, /Not available/);
  assert.doesNotMatch(rendered.html, /Employee filter|Team filter/);
  assert.ok(rendered.calls.every((call) => !call.url.startsWith('/statistics') && !call.url.startsWith('/teams')));
});
test('team UI only requests its assigned team and no data when unassigned', async () => {
  const rendered = renderDashboard('src/components/home/dashboard/teamLeadDashboardContent.js', { role: 'team_lead', teamId: { _id: 'mine' }, states: [{ data: {} }, { data: [] }, { data: { trend: [] } }, { data: { tasks: [], pages: 0, total: 0 } }] });
  await rendered.complete();
  assert.equal(rendered.calls.length, 4); assert.ok(rendered.calls.every((call) => call.url.startsWith('/teams/mine/')));
  assert.match(rendered.html, /Completion trend/); assert.doesNotMatch(rendered.html, /Not supported/);
  const missing = renderDashboard('src/components/home/dashboard/teamLeadDashboardContent.js', { role: 'team_lead' });
  await missing.complete(); assert.equal(missing.calls.length, 0); assert.match(missing.html, /No team is assigned/);
});
test('HR UI keeps company metrics separate and supports desktop and mobile column branches', async () => {
  for (const width of [390, 768, 1280]) {
    const rendered = renderDashboard('src/components/home/hrDashboardContent.js', { role: 'hr_manager', width, states: [{ data: [] }] });
    await rendered.complete();
    assert.match(rendered.html, /HR dashboard/); assert.match(rendered.html, /Company-wide/); assert.match(rendered.html, /Department task activity/);
    assert.match(rendered.html, width === 1280 ? /48.8%/ : /100%/);
    assert.equal(rendered.calls.length, 8);
    assert.doesNotMatch(rendered.html, /Performance trend|Completed tasks over time|Trend grouping/);
    assert.ok(rendered.calls.every((call) => !call.url.includes('trends')));
    for (const call of rendered.calls.filter((call) => ['/statistics/attendance', '/statistics/leaves'].includes(call.url))) assert.deepEqual(Object.keys(call.params).sort(), ['endDate', 'startDate']);
  }
});

test('malformed records and prototype status names never become counts or ranking data', () => {
  for (const rows of [[null], [undefined], [1], [[]], {}]) {
    assert.equal(d.records(rows), null);
    assert.equal(d.countTaskStatuses(rows), null);
    assert.throws(() => d.responseRecords({ success: true, data: rows }));
  }
  assert.equal(d.countTaskStatuses([{ status: 'toString' }]), null);
  assert.equal(d.rankRows([{ openTasks: 3 }, { openTasks: '4' }], 'openTasks'), null);
  assert.deepEqual(d.rankRows([{ openTasks: 0 }, { openTasks: 3 }], 'openTasks'), [{ openTasks: 3 }, { openTasks: 0 }]);
});

test('rates with known empty denominators are unavailable; real zero rates remain zero', () => {
  assert.equal(d.rateWithPopulation(0, 0), undefined);
  assert.equal(d.rateWithPopulation(0, 3), 0);
  assert.equal(d.rateWithPopulation(50, undefined), undefined);
  assert.equal(d.rateWithPopulation(101, 3), undefined);
  assert.deepEqual(d.rankRows([{ completionRate: 0, totalTasks: 0 }, { completionRate: 0, totalTasks: 3 }], 'completionRate', 'totalTasks'), [{ completionRate: 0, totalTasks: 3 }]);
});

test('overdue pagination validates counters and supports a page removed after refresh', () => {
  assert.deepEqual(d.overduePage({ success: true, data: [], total: 0, page: 3, pages: 0 }, 3, 10), { tasks: [], total: 0, pages: 0 });
  for (const override of [{ total: -1 }, { page: 2 }, { pages: '0' }, { total: 5, pages: 1 }]) {
    assert.throws(() => d.overduePage({ success: true, data: [], total: 0, page: 1, pages: 0, ...override }, 1, 10));
  }
});

test('failed forced refresh invalidates old cache instead of resurrecting stale results', async () => {
  const resource = createDashboardResource();
  await resource.load('same', async () => 1);
  await resource.load('same', async () => { throw { error: { details: 'not a message' } }; }, true);
  assert.equal(typeof resource.store.getState().error, 'string');
  let requests = 0;
  await resource.load('same', async () => { requests += 1; return 2; });
  assert.equal(requests, 1); assert.equal(resource.store.getState().data, 2);
});

test('calendar reopens at the valid draft, falls back only for invalid input, and preserves local dates', () => {
  assert.equal(f.dateString(f.calendarDate('2026-09-15', '2026-10-01')), '2026-09-15');
  for (const value of ['', '2026-02-30', 'invalid']) assert.equal(f.dateString(f.calendarDate(value, '2026-10-01')), '2026-10-01');
  assert.equal(d.displayDate('invalid'), 'Not available');
  assert.equal(d.displayDate(null), 'Not available');
});

test('calendar preserves legacy string callback and supports raw dates and Android back', () => {
  const date = new Date(2026, 9, 10);
  for (const raw of [false, true]) {
    let selected; let closed = false;
    const callback = (value) => { selected = value; };
    const rendered = renderDashboard('src/components/task/calendarModal.js', { props: {
      visible: true, initialDate: date, onClose: () => { closed = true; },
      ...(raw ? { onSelectDateValue: callback } : { onSelectDate: callback }),
    } });
    const confirm = rendered.events.find((event) => event.children?.props?.children === 'Confirm');
    confirm.onPress();
    assert.equal(raw ? f.dateString(selected) : selected, raw ? '2026-10-10' : '10 October 2026');
    rendered.events.find((event) => event.onRequestClose).onRequestClose();
    assert.equal(closed, true);
    assert.match(rendered.html, /Previous month/);
  }
});

test('malformed chart/table rows show unavailable states instead of crashing', () => {
  for (const exportName of ['SeriesChart', 'Distribution', 'DataTable']) {
    const rendered = renderDashboard('src/components/home/dashboard/dashboardUI.js', { exportName, props: { rows: [null], headers: ['Value'], valueKey: 'count' } });
    assert.match(rendered.html, /Not available/);
  }
});

test('loading skeleton hides stale children and missing options are not selectable', () => {
  const React = require('react');
  const section = renderDashboard('src/components/home/dashboard/dashboardUI.js', { exportName: 'Section', props: { title: 'Overview', resource: { status: 'loading' }, children: React.createElement('span', null, 'stale metrics') } });
  assert.match(section.html, /Loading Overview/); assert.doesNotMatch(section.html, /stale metrics/);
  const filter = renderDashboard('src/components/home/dashboard/dashboardFilters.js', { exportName: 'SelectFilter', props: { label: 'Employee', options: [[undefined, 'Missing identity']] } });
  assert.match(filter.html, /filter options are not available/); assert.doesNotMatch(filter.html, /<select/);
});

test('HR department ranking is explicitly headcount, with descending real counts', async () => {
  const rendered = renderDashboard('src/components/home/hrDashboardContent.js', { states: [
    { data: [] }, {}, {}, {}, {}, {}, { data: [] },
    { data: [{ department: 'Small', count: 1 }, { department: 'Large', count: 3 }] },
  ] });
  await rendered.complete();
  assert.match(rendered.html, /Descending active headcount/);
  assert.ok(rendered.html.indexOf('Large') < rendered.html.indexOf('Small'));
  assert.match(rendered.html, /Headcount does not measure departmental activity/);
});

test('attendance and leave pie legends retain semantic colors and text labels', () => {
  const rows = ['present', 'late', 'absent', 'sick', 'vacation', 'personal'].map((_id) => ({ _id, count: 1 }));
  const rendered = renderDashboard('src/components/home/dashboard/dashboardUI.js', { exportName: 'Distribution', props: { rows } });
  const config = load('src/components/home/dashboard/chartConfig.js');
  assert.equal(config.DISTRIBUTION_COLORS.late, config.STATUS_COLORS.todo);
  assert.equal(config.DISTRIBUTION_COLORS.present, config.STATUS_COLORS.done);
  assert.equal(config.DISTRIBUTION_COLORS.absent, config.LEAVE_TYPE_COLORS.sick);
  for (const label of ['Present', 'Late', 'Absent', 'Sick', 'Vacation', 'Personal']) assert.ok(rendered.events.some((event) => event.accessibilityLabel === `${label}: 1` && event.onPress));
  assert.match(rendered.html, /#10B981/); assert.match(rendered.html, /#EF4444/);
});

test('malformed rows do not crash any role dashboard or silently create zero metrics', async () => {
  const scenarios = [
    ['src/components/home/dashboard/employeeDashboardContent.js', { states: [{ data: { performanceTrend: [null] } }, { data: [null] }, { data: [null] }] }],
    ['src/components/home/dashboard/teamLeadDashboardContent.js', { role: 'team_lead', teamId: 'mine', states: [{ data: { workloadByMember: [null] } }, { data: [null] }, { data: { tasks: [null], pages: 1, total: 1 } }] }],
    ['src/components/home/hrDashboardContent.js', { states: [{ data: [null] }, {}, {}, { data: { daily: [null] } }, { data: { byType: [null] } }, {}, { data: [null] }, { data: [null] }] }],
  ];
  for (const [filename, options] of scenarios) {
    const rendered = renderDashboard(filename, options);
    await rendered.complete(); assert.match(rendered.html, /Not available/);
  }
});
test('dashboard errors expose retry while independent sections still render', async () => {
  const rendered = renderDashboard('src/components/home/dashboard/employeeDashboardContent.js', { role: 'employee', states: [{ status: 'error', error: 'offline', data: null }, { data: [] }, { data: [] }] });
  await rendered.complete(); assert.match(rendered.html, /Retry My overview/); assert.match(rendered.html, /Overdue tasks/); assert.match(rendered.html, /No records/);
});
