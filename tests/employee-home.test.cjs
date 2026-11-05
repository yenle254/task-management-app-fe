const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(__dirname, '..', file);
    if (Object.hasOwn(mocks, absolute)) return mocks[absolute];
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), { filename: absolute, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'] }).code;
    new Function('require', 'module', 'exports', code)(name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('.svg')) return () => null;
      return name.startsWith('.') ? load(path.resolve(path.dirname(absolute), name.endsWith('.js') ? name : `${name}.js`)) : require(name);
    }, module, module.exports);
    return module.exports;
  }
  return load;
}
const absolute = file => path.resolve(__dirname, '..', file);
const data = loader()('src/utils/employeeHomeData.js');
const task = { _id: 'personal-task', title: 'My actual assignment', status: 'todo', priority: 'high', progress: 20, assignedTo: [] };
const response = { success: true, data: [task], page: 1, pages: 1, total: 1 };

function native(presses) {
  const host = ({ children, onPress }) => { if (onPress) presses.push({ children, onPress }); return React.createElement('div', null, children); };
  return { View: host, Text: host, Pressable: host, ScrollView: host, RefreshControl: host, StatusBar: () => null,
    ActivityIndicator: () => React.createElement('span', null, 'Loading'), StyleSheet: { create: value => value } };
}

function renderHome(states) {
  let index = 0;
  const presses = [], calls = [], fetchers = [], navigations = [], reloads = [];
  const resources = states.map((state, i) => ({ ...state, reload: () => reloads.push(i) }));
  const mocks = {
    'react-native': native(presses),
    '@react-navigation/native': { useFocusEffect: () => {} },
    [absolute('src/hooks/useDashboardResource.js')]: { __esModule: true, default: (key, fetcher) => { fetchers.push(fetcher); return resources[index++]; }, useDashboardRefresh: () => {} },
    [absolute('src/services/taskService.js')]: { getCalendar: async params => { calls.push(['calendar', params]); return { success: true, data: [task] }; }, getMyTasks: async params => { calls.push(['my', params]); return response; } },
    [absolute('src/components/avatar.js')]: () => null,
    [absolute('src/components/progressBar.js')]: () => null,
    [absolute('src/components/taskCategory.js')]: () => null,
    [absolute('src/components/home/dashboard/dashboardUI.js')]: { Action: ({ children, onPress }) => { presses.push({ children, onPress }); return React.createElement('button', null, children); } },
  };
  const Home = loader(mocks)('src/components/home/employeeHomeContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Home, { navigation: { navigate: (...args) => navigations.push(args) } }));
  return { html, presses, calls, fetchers, navigations, reloads };
}

test('ordinary employee Home fetches only personal calendar and assigned tasks; both Details routes target the real task', async () => {
  const result = renderHome([{ status: 'ready', data: [task] }, { status: 'ready', data: { tasks: [task], total: 1, pages: 1 } }]);
  await Promise.all(result.fetchers.map(fetcher => fetcher()));
  assert.deepEqual(result.calls, [
    ['calendar', { from: data.localDay(), to: data.localDay(), scope: 'self' }],
    ['my', { page: 1, limit: 5, sort: 'createdAt_desc' }],
  ]);
  for (const text of ['Welcome Back', 'Today schedules', 'My tasks', 'My actual assignment']) assert.ok(result.html.includes(text));
  assert.doesNotMatch(result.html, /Report filters|My dashboard|Performance trend|My overview/);
  const details = result.presses.filter(button => React.isValidElement(button.children) && button.children.props.children === 'Details');
  assert.equal(details.length, 2);
  details.forEach(button => button.onPress());
  assert.deepEqual(result.navigations, [['TaskDetail', { taskId: task._id }], ['TaskDetail', { taskId: task._id }]]);
});

test('empty, loading and retry states do not show example assignments or pretend the request succeeded', () => {
  const empty = renderHome([{ status: 'ready', data: [] }, { status: 'ready', data: { tasks: [], total: 0, pages: 0 } }]);
  assert.match(empty.html, /No Schedule Available/);
  assert.match(empty.html, /No Task Assigned/);
  const failed = renderHome([{ status: 'error', error: 'Calendar unavailable' }, { status: 'loading' }]);
  assert.match(failed.html, /Calendar unavailable/);
  assert.match(failed.html, /Loading/);
  assert.doesNotMatch(failed.html, /No Task Assigned|No Schedule Available/);
  failed.presses.find(button => Array.isArray(button.children) && button.children[0] === 'Retry ').onPress();
  assert.deepEqual(failed.reloads, [0]);
});

test('calendar preview retains real total and offers the personal calendar for remaining items', () => {
  const tasks = Array.from({ length: 4 }, (_, i) => ({ ...task, _id: `task-${i}`, title: `Assignment ${i}` }));
  const result = renderHome([{ status: 'ready', data: tasks }, { status: 'ready', data: { tasks: [], total: 0, pages: 0 } }]);
  assert.match(result.html, /Assignment 2/);
  assert.doesNotMatch(result.html, /Assignment 3/);
  result.presses.find(button => Array.isArray(button.children) && button.children[0] === 'View all ').onPress();
  assert.deepEqual(result.navigations, [['TaskCalendar', { scope: 'self' }]]);
});

test('incomplete or failed responses are rejected and a missing start time is never fabricated', () => {
  assert.deepEqual(data.homeTaskPage(response, 1, 5).tasks, [task]);
  assert.throws(() => data.homeTaskPage({ ...response, total: 8, pages: 2 }, 1, 5), /pagination/);
  assert.throws(() => data.homeTasks({ success: false, data: [] }));
  assert.throws(() => data.homeTasks({ success: true, data: [{}] }));
  assert.equal(data.scheduleTime({}), 'Time not set');
  assert.match(data.scheduleTime({ dueDate: '2026-11-01T10:00:00Z' }), /^Due /);
  assert.doesNotMatch(data.scheduleTime({ dueDate: '2026-11-01T10:00:00Z' }), /–/);
  assert.equal(data.localDay(new Date(2026, 10, 1, 0, 1)), '2026-11-01');
});

test('Home selects employee content only for employees and preserves the HR/team lead dashboards', () => {
  for (const [role, expected] of [['employee', 'Employee Home'], ['hr_manager', 'HR Dashboard'], ['team_lead', 'Lead Dashboard']]) {
    const host = ({ children }) => React.createElement('div', null, children);
    const mocks = {
      'react-native': native([]), 'react-native-safe-area-context': { SafeAreaView: host },
      '@react-navigation/native': { useFocusEffect: () => {} },
      [absolute('src/contexts/authContext.js')]: { useAuth: () => ({ user: { _id: 'account', role } }) },
      [absolute('store/index.js')]: { useNotificationStore: selector => selector({ fetchUnreadCount: async () => {}, fetchNotifications: async () => {} }) },
      [absolute('src/components/home/userHeader.js')]: () => null,
      [absolute('src/components/home/employeeHomeContent.js')]: () => React.createElement('div', null, 'Employee Home'),
      [absolute('src/components/home/hrDashboardContent.js')]: () => React.createElement('div', null, 'HR Dashboard'),
      [absolute('src/components/home/dashboard/teamLeadDashboardContent.js')]: () => React.createElement('div', null, 'Lead Dashboard'),
    };
    const Home = loader(mocks)('src/screens/homeScreen.js').default;
    assert.ok(renderToStaticMarkup(React.createElement(Home, { navigation: {} })).includes(expected));
  }
});
