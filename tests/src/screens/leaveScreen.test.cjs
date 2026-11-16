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

for (const role of ['employee', 'team_lead', 'hr_manager']) {
  test(`LeaveScreen shows "Review team leave requests" button for team_lead/hr_manager only (${role})`, () => {
    const navigations = [];
    const rn = Object.fromEntries(
      ['View', 'Text', 'TouchableOpacity', 'ScrollView', 'RefreshControl', 'ActivityIndicator', 'Modal', 'Pressable'].map(
        (k) => [k, k]
      )
    );
    const LeaveScreen = loadModule('src/screens/leaveScreen.js', {
      react: {
        ...React,
        useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
        useEffect: () => {},
        useMemo: (fn) => fn(),
        useCallback: (fn) => fn,
      },
      'react-native': { ...rn, StyleSheet: { create: (s) => s }, Alert: { alert() {} } },
      '../styles/color': { primary: '#7057FC', secondary: '#f0f1f7', white: '#fff', black: '#000' },
      '../../store': {
        useLeaveStore: () => ({
          leaves: [],
          leaveBalance: { total: 12, used: 2, remaining: 10 },
          isLoading: false,
          isMutating: false,
          error: null,
          fetchLeaves: async () => {},
          fetchLeaveBalance: async () => {},
          cancelLeave: async () => {},
          clearError: () => {},
        }),
      },
      '../components/appButton': 'AppButton',
      '../components/headerPromo': 'HeaderPromo',
      '../components/task/iconCardText': 'IconCardText',
      '../contexts/authContext': { useAuth: () => ({ user: { _id: 'u1', role } }) },
      '@react-navigation/native': { useFocusEffect: () => {} },
      '../components/leave/leaveWorkflowDetails': {
        __esModule: true,
        default: 'LeaveWorkflowDetails',
        leaveStatusLabel: (s) => s,
      },
    }).default;

    const tree = LeaveScreen({ navigation: { navigate: (...args) => navigations.push(args) } });
    const reviewBtn = collectNodes(tree).find(
      (n) => n.type === 'TouchableOpacity' && n.props.children?.props?.children === 'Review team leave requests'
    );
    if (role === 'employee') {
      assert.equal(reviewBtn, undefined);
    } else {
      assert.ok(reviewBtn);
      reviewBtn.props.onPress();
      assert.deepEqual(navigations, [['LeaveInbox']]);
    }
  });
}

