const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const React = require('react');

function harness() {
  const slots = [], cache = new Map(), changes = [];
  let cursor = 0;
  const react = { ...React, useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
  } };
  const native = { StyleSheet: { create: x => x, absoluteFillObject: {} }, View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView', Modal: 'Modal' };
  function load(file) {
    const filename = path.resolve(__dirname, '..', file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), { configFile: false, babelrc: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'] }).code;
    new Function('require', 'module', 'exports', code)(name => {
      if (name === 'react') return react;
      if (name === 'react-native') return native;
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 24 }) };
      if (name === 'react-native-chart-kit') return {};
      if (name.endsWith('.svg') || name.endsWith('calendarModal')) return () => null;
      return name.startsWith('.') ? load(path.resolve(path.dirname(filename), name + '.js')) : require(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  const Select = load('src/components/home/dashboard/dashboardFilters.js').SelectFilter;
  const props = { label: 'Task status', value: '', options: [['', 'All statuses'], ['todo', 'To Do'], ['done', 'Completed']], onChange: value => changes.push(value) };
  const render = () => { cursor = 0; return Select(props); };
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) { const match = find(child, predicate); if (match) return match; }
    return null;
  }
  const byLabel = label => find(render(), n => n.props?.accessibilityLabel === label);
  const action = title => find(render(), n => n.props?.children === title);
  return { props, changes, render, find, byLabel, action, open: () => byLabel('Task status: All statuses').props.onPress() };
}

test('selecting an option stays local until Confirm, including the empty All value', () => {
  const h = harness(); h.open();
  h.byLabel('Completed').props.onPress(); assert.deepEqual(h.changes, []);
  assert.equal(h.byLabel('Completed').props.accessibilityState.checked, true);
  h.action('Confirm').props.onPress(); assert.deepEqual(h.changes, ['done']);
  assert.equal(h.find(h.render(), n => n.type === 'Modal'), null);
  h.props.value = 'done'; h.byLabel('Task status: Completed').props.onPress();
  h.byLabel('All statuses').props.onPress(); h.action('Confirm').props.onPress();
  assert.deepEqual(h.changes, ['done', '']);
});

test('Close and Android Back discard the draft; reopening uses the saved filter', () => {
  const h = harness(); h.open(); h.byLabel('To Do').props.onPress(); h.action('Close').props.onPress();
  assert.deepEqual(h.changes, []); h.open();
  assert.equal(h.byLabel('All statuses').props.accessibilityState.checked, true);
  h.byLabel('Completed').props.onPress(); h.find(h.render(), n => n.type === 'Modal').props.onRequestClose();
  assert.deepEqual(h.changes, []); assert.equal(h.find(h.render(), n => n.type === 'Modal'), null);
});

test('removed options cannot be confirmed and disabled filters expose disabled state', () => {
  const h = harness(); h.open(); h.byLabel('To Do').props.onPress();
  h.props.options = [['', 'All statuses']];
  assert.equal(h.action('Confirm').props.disabled, true); h.action('Confirm').props.onPress();
  assert.deepEqual(h.changes, []);
  h.props.disabled = true;
  assert.equal(h.byLabel('Task status: All statuses').props.disabled, true);
  assert.equal(h.find(h.render(), n => n.type === 'Modal'), null);
});
