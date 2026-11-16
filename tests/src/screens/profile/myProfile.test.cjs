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

function collectNodes(node, acc = []) {
  if (Array.isArray(node)) node.forEach((child) => collectNodes(child, acc));
  else if (node && typeof node === 'object' && node.props) {
    acc.push(node);
    collectNodes(node.props.children, acc);
  }
  return acc;
}

for (const role of ['employee', 'team_lead', 'hr_manager']) {
  test(`MyProfile shows Audit Log only for hr_manager (${role})`, () => {
    const navigations = [];
    const nav = { navigate: (...args) => navigations.push(args), goBack() {} };
    const MyProfile = loadModule('src/screens/profile/myProfile.js', {
      react: { ...React, useState: (v) => [v, () => {}], useEffect: () => {}, useMemo: (fn) => fn() },
      '@react-navigation/native': { useNavigation: () => nav },
      'react-native': {
        Alert: { alert() {} },
        Pressable: 'Pressable',
        ScrollView: 'ScrollView',
        StyleSheet: { create: (s) => s },
        Text: 'Text',
        TouchableOpacity: 'TouchableOpacity',
        View: 'View',
      },
      'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
      '../../components/avatar': 'Avatar',
      '../../components/profile/clickChange': 'ClickChange',
      '../../components/profile/viewInf': 'ViewInf',
      '@/src/contexts/authContext': {
        useAuth: () => ({
          user: { _id: 'u1', role, email: 'u1@example.test', profile: { fullName: 'User One' } },
          signOut: async () => {},
        }),
      },
      '../../styles/color': { white: '#fff', primary: '#7057FC', black: '#000', secondary: '#f0f1f7' },
    }).default;

    const tree = MyProfile({ navigation: nav });
    const items = collectNodes(tree).filter((n) => n.type === 'ClickChange');
    const titles = items.map((n) => n.props.title);

    assert.ok(titles.includes('Change Password'));
    assert.ok(titles.includes('Notification settings'));
    assert.ok(titles.includes('Logout'));
    assert.equal(titles.includes('Audit Log'), role === 'hr_manager');

    if (role === 'hr_manager') {
      items.find((n) => n.props.title === 'Audit Log').props.onPress();
      assert.deepEqual(navigations, [['AuditLog']]);
    }
  });
}

