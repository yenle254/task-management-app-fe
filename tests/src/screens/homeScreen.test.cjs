const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

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
    if (name.endsWith('.svg')) return name;
    return require(name);
  }, mod, mod.exports);
  return mod.exports;
}

function collectNodes(node, acc = []) {
  if (Array.isArray(node)) node.forEach((child) => collectNodes(child, acc));
  else if (node && typeof node === 'object' && node.props) {
    acc.push(node);
    collectNodes(node.props.children, acc);
  }
  return acc;
}

for (const [role, expectedDashboard, teamIdValue, expectedKeySuffix] of [
  ['employee', 'EmployeeHomeContent', 'team-1', 'team-1'],
  ['team_lead', 'TeamLeadDashboardContent', { _id: 'team-2', name: 'QA' }, 'team-2'],
  ['hr_manager', 'HRDashboardContent', null, 'undefined'],
]) {
  test(`HomeScreen selects ${expectedDashboard} and normalizes teamId key for ${role}`, () => {
    const HomeScreen = loadModule('src/screens/homeScreen.js', {
      react: {
        ...React,
        useState: (v) => [v, () => {}],
        useCallback: (fn) => fn,
        useRef: (v) => ({ current: v }),
      },
      '@react-navigation/native': { useFocusEffect: () => {} },
      'react-native': {
        RefreshControl: 'RefreshControl',
        ScrollView: 'ScrollView',
        StatusBar: 'StatusBar',
        StyleSheet: { create: (s) => s },
        Text: 'Text',
      },
      'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
      '../../store/index': {
        useNotificationStore: (sel) => sel({ fetchUnreadCount: async () => {}, fetchNotifications: async () => {} }),
      },
      '../components/home/userHeader': 'UserHeader',
      '../components/home/hrDashboardContent': 'HRDashboardContent',
      '../components/home/employeeHomeContent': 'EmployeeHomeContent',
      '../components/home/dashboard/teamLeadDashboardContent': 'TeamLeadDashboardContent',
      '../contexts/authContext': { useAuth: () => ({ user: { _id: 'u1', role, teamId: teamIdValue } }) },
      '../styles/color': { white: '#fff', secondary: '#f0f1f7', primary: '#7057FC' },
    }).default;

    const tree = HomeScreen({ navigation: { navigate() {} } });
    const dashboardNode = collectNodes(tree).find((n) => n.type === expectedDashboard);
    assert.ok(dashboardNode, `Expected ${expectedDashboard} to be rendered`);
    assert.equal(dashboardNode.key, `u1:${role}:${expectedKeySuffix}`);
  });
}

test('HomeScreen renders role fallback message for unsupported role', () => {
  const HomeScreen = loadModule('src/screens/homeScreen.js', {
    react: {
      ...React,
      useState: (v) => [v, () => {}],
      useCallback: (fn) => fn,
      useRef: (v) => ({ current: v }),
    },
    '@react-navigation/native': { useFocusEffect: () => {} },
    'react-native': {
      RefreshControl: 'RefreshControl',
      ScrollView: 'ScrollView',
      StatusBar: 'StatusBar',
      StyleSheet: { create: (s) => s },
      Text: 'Text',
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../../store/index': {
      useNotificationStore: (sel) => sel({ fetchUnreadCount: async () => {}, fetchNotifications: async () => {} }),
    },
    '../components/home/userHeader': 'UserHeader',
    '../components/home/hrDashboardContent': 'HRDashboardContent',
    '../components/home/employeeHomeContent': 'EmployeeHomeContent',
    '../components/home/dashboard/teamLeadDashboardContent': 'TeamLeadDashboardContent',
    '../contexts/authContext': { useAuth: () => ({ user: { _id: 'u9', role: 'guest' } }) },
    '../styles/color': { white: '#fff', secondary: '#f0f1f7', primary: '#7057FC' },
  }).default;

  const tree = HomeScreen({ navigation: {} });
  const fallback = collectNodes(tree).find(
    (n) => n.type === 'Text' && n.props.children === 'Dashboard is not available for this role.'
  );
  assert.ok(fallback);
});

