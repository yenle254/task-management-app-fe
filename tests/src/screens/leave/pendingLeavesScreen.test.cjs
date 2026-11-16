const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

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

test('PendingLeavesScreen passes step=team_lead for team_lead and {} for hr_manager', async () => {
  for (const [role, expectedParam] of [
    ['team_lead', { step: 'team_lead' }],
    ['hr_manager', {}],
  ]) {
    const fetchCalls = [];
    const focusCallbacks = [];
    const rn = Object.fromEntries(
      ['View', 'Text', 'TouchableOpacity', 'ScrollView', 'RefreshControl', 'ActivityIndicator', 'Pressable', 'Modal', 'TextInput'].map(
        (k) => [k, k]
      )
    );
    const PendingLeavesScreen = loadModule('src/screens/leave/pendingLeavesScreen.js', {
      react: {
        ...React,
        useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
        useEffect: () => {},
        useMemo: (fn) => fn(),
        useCallback: (fn) => fn,
      },
      'react-native': { ...rn, StyleSheet: { create: (s) => s }, Alert: { alert() {} } },
      '../../components/headerPromo': 'HeaderPromo',
      '../../styles/color': { primary: '#7057FC', secondary: '#f0f1f7', white: '#fff', black: '#000' },
      '../../components/appButton': 'AppButton',
      '../../components/avatar': 'Avatar',
      '@/src/components/task/iconCardText': 'IconCardText',
      '../../../store': {
        useLeaveStore: () => ({
          pendingLeaves: [],
          isLoading: false,
          isMutating: false,
          error: null,
          fetchPendingLeaves: async (p) => fetchCalls.push(p),
          approveLeave: async () => {},
          rejectLeave: async () => {},
          clearError: () => {},
        }),
      },
      '../../contexts/authContext': { useAuth: () => ({ user: { _id: 'actor-1', role } }) },
      '../../services/api': { get: async () => ({ success: true, stats: { pending: 0, approved: 0, rejected: 0 }, data: [] }) },
      '@react-navigation/native': { useFocusEffect: (fn) => focusCallbacks.push(fn) },
      '../../components/leave/leaveWorkflowDetails': {
        __esModule: true,
        default: 'LeaveWorkflowDetails',
        leaveStatusLabel: (s) => s,
      },
    }).default;

    PendingLeavesScreen({ navigation: {} });
    await focusCallbacks[0]();
    assert.deepEqual(fetchCalls, [expectedParam]);
  }
});

