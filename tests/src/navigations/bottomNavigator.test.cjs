const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

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

for (const [role, expectedTabs, expectedLeaveInitial] of [
  ['employee', ['home', 'clockin', 'task', 'leave'], 'MyLeaves'],
  ['team_lead', ['home', 'clockin', 'task', 'leave'], 'MyLeaves'],
  ['hr_manager', ['home', 'clockin', 'task', 'team', 'PendingLeaves'], 'LeaveInbox'],
]) {
  test(`BottomNavigator & LeaveStackNavigator expose exact tabs and initial leave route for ${role}`, () => {
    const Nav = {
      Navigator: ({ children, initialRouteName }) => ({ type: 'Navigator', props: { children, initialRouteName } }),
      Screen: (props) => ({ type: 'Screen', props }),
    };
    const BottomNavigator = loadModule('src/navigations/bottomNavigator.js', {
      '@react-navigation/bottom-tabs': { createBottomTabNavigator: () => Nav },
      '@react-navigation/native-stack': { createNativeStackNavigator: () => Nav },
      '../screens/clockinScreen': 'ClockinScreen',
      '../screens/homeScreen': 'HomeScreen',
      '../screens/leaveScreen': 'LeaveScreen',
      './taskNavigator': 'TaskNavigator',
      './teamStackNavigator': 'TeamStackNavigator',
      '../screens/leave/pendingLeavesScreen': 'PendingLeavesScreen',
      '../contexts/authContext': { useAuth: () => ({ user: { _id: 'u1', role } }) },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    }).default;

    const tree = BottomNavigator();
    const screens = collectNodes(tree).filter((n) => n.type === Nav.Screen);
    assert.deepEqual(screens.map((s) => s.props.name), expectedTabs);

    const leaveTab = screens.find((s) => ['leave', 'PendingLeaves'].includes(s.props.name));
    assert.ok(leaveTab);
    const leaveTree = leaveTab.props.component();
    assert.equal(leaveTree.props.initialRouteName, expectedLeaveInitial);
  });
}

