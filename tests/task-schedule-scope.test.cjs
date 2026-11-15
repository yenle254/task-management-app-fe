const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');
const dateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const today = dateKey(new Date());
const task = { _id: 'visible-task', title: 'Task assigned to another employee', status: 'in_progress', startDate: today + 'T00:00:00', dueDate: today + 'T23:59:00', assignedTo: [{ _id: 'employee', profile: { fullName: 'Member', avatar: 'https://api.example/uploads/member.png' } }], progress: 35 };
function harness(file, role, params) {
  const calls = [], navigations = [];
  const action = name => async input => { calls.push([name, input]); };
  const store = { calendarTasks: [task], timelineTasks: [task], getCalendar: action('calendar'), getTimeline: action('timeline'),
    tasks: [], myTasks: [], teamTasks: [], filters: { search: '' }, fetchTaskPage: action('list'), fetchTaskStats: action('stats'), fetchTeamTaskStats: action('teamStats'), setFilters() {} };
  const navigation = { navigate: (...args) => navigations.push(args), goBack() {} };
  const rn = Object.fromEntries(['ActivityIndicator','ScrollView','Text','TouchableOpacity','View','FlatList','RefreshControl','TextInput'].map(key => [key, key]));
  const mocks = {
    react: { ...React, useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect() {}, useMemo: fn => fn(), useCallback: fn => fn, useRef: value => ({ current: value }) },
    'react-native': { ...rn, StyleSheet: { create: styles => styles }, useWindowDimensions: () => ({ width: 390 }) },
    '@react-navigation/native': { useFocusEffect: fn => fn(), useNavigation: () => navigation },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 24, bottom: 0 }) },
    'react-native-svg': { __esModule: true, default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Text: 'SvgText' },
    '../../contexts/authContext': { useAuth: () => ({ user: { _id: 'viewer', role, teamId: 'team-a' }, canManageTasks: () => role !== 'employee', isLoading: false }) },
    '../../../store/taskStore': () => store,
    '../../components/task/calendarModal': { __esModule: true, default: 'CalendarModal', getDaysInMonth: date => [...Array(new Date(date.getFullYear(), date.getMonth(), 1).getDay()).fill(null), ...Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, i) => new Date(date.getFullYear(), date.getMonth(), i + 1))] },
    '../../components/task/taskFilterBar': { __esModule: true, default: 'TaskFilterBar', dateKey },
    '../../utils/taskStatusMap': { getTaskStatus: status => ({ label: status, color: '#123456' }) },
    '../../styles/color': { primary: '#7057FC', secondary: '#f0f1f7', white: '#fff', black: '#000' },
    '../../services/taskService': { getPendingApprovalStats: async () => ({ data: { pending: 0 } }) },
    '../../utils/taskReviewEvents': { subscribeTaskReview: () => () => {} },
  };
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '../src/screens/task', file), 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'] }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.svg') || name.startsWith('../../components/')) return name;
    throw Error('Missing mock: ' + name);
  }, mod, mod.exports);
  return { tree: mod.exports.default({ navigation, route: { params } }), calls, navigations };
}
function nodes(value, result = []) {
  if (Array.isArray(value)) value.forEach(item => nodes(item, result));
  else if (value && typeof value === 'object' && value.props) {
    result.push(value); nodes(value.props.children, result); nodes(value.props.ListHeaderComponent, result);
  }
  return result;
}
for (const [file, action] of [['taskCalendarScreen.js','calendar'], ['taskTimelineScreen.js','timeline']]) {
  test(action + ': HR loads management scope and task cards still open the existing detail route', () => {
    const result = harness(file, 'hr_manager');
    assert.equal(result.calls[0][0], action);
    assert.equal(result.calls[0][1].scope, 'team');
    assert.equal(result.calls[0][1].teamId, undefined);
    assert.ok(result.calls[0][1].from && result.calls[0][1].to);
    assert.ok(nodes(result.tree).some(node => node.type === 'Text' && node.props.children === task.title));
    const avatars = nodes(result.tree).filter(node => node.type === '../../components/avatar');
    assert.equal(avatars.length, 1);
    assert.deepEqual({ userId: avatars[0].props.userId, url: avatars[0].props.url, name: avatars[0].props.name },
      { userId: 'employee', url: task.assignedTo[0].profile.avatar, name: 'Member' });
    assert.equal(avatars[0].props.width, 30);
    assert.equal(avatars[0].props.height, 30);
    for (const node of nodes(result.tree)) if (node.type === 'TouchableOpacity') node.props.onPress?.();
    assert.ok(result.navigations.some(([screen, params]) => screen === 'TaskDetail' && params.taskId === task._id));
  });
  for (const role of ['team_lead', 'employee']) test(action + ': preserves ' + role + ' self scope', () => {
    assert.equal(harness(file, role).calls[0][1].scope, 'self');
  });
  test(action + ': preserves explicit self scope and explicit team selection', () => {
    assert.equal(harness(file, 'hr_manager', { scope: 'self' }).calls[0][1].scope, 'self');
    const query = harness(file, 'hr_manager', { scope: 'team', teamId: 'selected-team' }).calls[0][1];
    assert.equal(query.teamId, 'selected-team');
  });
  test(action + ': HR uses exactly the same rendered layout as the leader for the same tasks', context => {
    context.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    const shape = result => JSON.parse(JSON.stringify(result.tree, (key, value) => typeof value === 'function' ? value.name || 'callback' : value));
    assert.deepEqual(shape(harness(file, 'hr_manager')), shape(harness(file, 'team_lead')));
  });
}
for (const role of ['hr_manager','team_lead','employee']) test('task list navigation supplies correct Calendar/Timeline scope for ' + role, () => {
  const result = harness('taskScreen.js', role);
  for (const label of ['Calendar','Timeline']) {
    const button = nodes(result.tree).find(node => node.type === 'TouchableOpacity' && node.props.children?.props?.children === label);
    assert.ok(button); button.props.onPress();
  }
  assert.deepEqual(result.navigations, [['TaskCalendar', { scope: role === 'hr_manager' ? 'team' : 'self' }], ['TaskTimeline', { scope: role === 'hr_manager' ? 'team' : 'self' }]]);
});

for (const file of ['taskCalendarScreen.js', 'taskTimelineScreen.js']) test(file + ': fallback avatars follow user identity rather than assignee order', () => {
  const previous = task.assignedTo;
  try {
    task.assignedTo = [{ _id: 'a', profile: { fullName: 'Alice', avatar: null } }, { _id: 'b', email: 'bob@example.test', profile: {} }];
    const avatars = () => nodes(harness(file, 'hr_manager').tree).filter(node => node.type === '../../components/avatar').map(node => ({ id: node.props.userId, name: node.props.name }));
    assert.deepEqual(avatars(), [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'bob@example.test' }]);
    task.assignedTo.reverse();
    assert.deepEqual(avatars(), [{ id: 'b', name: 'bob@example.test' }, { id: 'a', name: 'Alice' }]);
  } finally { task.assignedTo = previous; }
});
