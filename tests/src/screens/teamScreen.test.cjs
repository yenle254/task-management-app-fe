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
  test(`TeamScreen shows Create Team action only for hr_manager (${role})`, () => {
    const navigations = [];
    const TeamScreen = loadModule('src/screens/teamScreen.js', {
      react: { ...React, useState: (v) => [v, () => {}], useEffect: () => {} },
      'react-native': {
        ActivityIndicator: 'ActivityIndicator',
        Alert: { alert() {} },
        RefreshControl: 'RefreshControl',
        ScrollView: 'ScrollView',
        StyleSheet: { create: (s) => s },
        Text: 'Text',
        View: 'View',
      },
      '../../store': {
        useTeamStore: () => ({
          teams: [{ _id: 't1', name: 'Engineering' }],
          isLoading: false,
          error: null,
          fetchTeams: async () => {},
          clearError: () => {},
        }),
      },
      '../components/appButton': 'AppButton',
      '../components/headerPromo': 'HeaderPromo',
      '../components/team': { TeamCard: 'TeamCard' },
      '../contexts/authContext': { useAuth: () => ({ user: { _id: 'u1', role } }) },
      '../styles/color': { primary: '#7057FC', secondary: '#f0f1f7', white: '#fff', black: '#000' },
    }).default;

    const tree = TeamScreen({ navigation: { navigate: (...args) => navigations.push(args) } });
    const buttons = collectNodes(tree).filter((n) => n.type === 'AppButton');
    const hasCreate = buttons.some((b) => /create/i.test(String(b.props.text || '')));
    assert.equal(hasCreate, role === 'hr_manager');
  });
}

