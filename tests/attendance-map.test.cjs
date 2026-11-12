const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const vm = require('node:vm');

function load(file, mocks = {}) {
  const code = babel.transformSync(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    filename: file, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
  }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), mod, mod.exports);
  return mod.exports;
}
const htmlModule = load('src/utils/attendanceMapHtml.js');
const { createAttendanceMapHtml } = htmlModule;
const point = { latitude: 10.87, longitude: 106.8 };
const office = { latitude: 10.871, longitude: 106.801, radius: 200 };

test('invalid/missing coordinates and radius are rejected, never replaced by a fake position', () => {
  for (const location of [null, { ...point, latitude: NaN }, { ...point, longitude: 181 }, { ...point, latitude: '</script>' }]) {
    assert.throws(() => createAttendanceMapHtml(location, office));
  }
  for (const radius of [0, -1, Infinity, '200']) assert.throws(() => createAttendanceMapHtml(point, { ...office, radius }));
});

test('document renders actual coordinates and office radius, with OSM attribution and HTTPS tiles', () => {
  const html = createAttendanceMapHtml(point, office);
  const elements = Object.fromEntries(['status', 'message', 'retry'].map(k => [k, {}]));
  let script, radius, boundsPoint, markerPoint, tileUrl, tileOptions;
  const bounds = { extend(p) { boundsPoint = p; return bounds; } };
  const map = { setView() { return map; }, fitBounds() {}, attributionControl: { setPrefix() {} } };
  const layer = { on() { return layer; }, addTo() { return layer; } };
  const L = {
    map: () => map,
    circle: (p, options) => { assert.deepEqual(Array.from(p), [office.latitude, office.longitude]); radius = options.radius; return { addTo: () => ({ getBounds: () => bounds }) }; },
    circleMarker: p => { markerPoint = p; return { addTo: () => ({ bindTooltip() {} }) }; },
    tileLayer: (url, options) => { tileUrl = url; tileOptions = options; return layer; },
  };
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document: { getElementById: id => elements[id], createElement: () => ({}), head: { appendChild: s => { script = s; } } },
    L, window: { L }, setTimeout: () => 1, clearTimeout() {},
  });
  script.onload();
  assert.equal(radius, office.radius);
  assert.deepEqual(Array.from(markerPoint), [point.latitude, point.longitude]);
  assert.deepEqual(Array.from(boundsPoint), [point.latitude, point.longitude]);
  assert.equal(tileUrl, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  assert.match(tileOptions.attribution, /OpenStreetMap contributors/);
  assert.equal(tileOptions.keepBuffer, 0);
});

test('untrusted color cannot inject script or markup', () => {
  const html = createAttendanceMapHtml(point, office, '</script><script>alert(1)</script>');
  assert.ok(!html.includes('alert(1)'));
});

function renderNative(available) {
  let required = false;
  const React = require('react');
  const mocks = {
    react: { ...React, useMemo: fn => fn(), useState: value => [value, () => {}] },
    'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'Button', StyleSheet: { create: x => x }, TurboModuleRegistry: { get: () => available ? {} : null }, Linking: { openURL: async () => {} } },
    '../styles/color': { primary: '#7057FC', secondary: '#f0f1f7' },
    '../utils/attendanceMapHtml': htmlModule,
  };
  Object.defineProperty(mocks, 'react-native-webview', { get() { required = true; return { WebView: 'WebView' }; } });
  const Component = load('src/components/attendanceMap.js', mocks).default;
  return { element: Component({ location: point, office }), required };
}

test('old APK without WebView shows fallback without requiring the missing native module', () => {
  const result = renderNative(false);
  assert.equal(result.required, false);
  assert.equal(result.element.type, 'View');
});

test('WebView keeps file access off, caching enabled and blocks arbitrary navigation', () => {
  const { element } = renderNative(true);
  assert.equal(element.type, 'WebView');
  assert.equal(element.props.allowFileAccess, false);
  assert.equal(element.props.cacheEnabled, true);
  assert.equal(element.props.onShouldStartLoadWithRequest({ url: 'about:blank' }), true);
  assert.equal(element.props.onShouldStartLoadWithRequest({ url: 'https://attacker.example/' }), false);
});

for (const inArea of [false, true]) test(`clock-in handler ${inArea ? 'sends the original GPS coordinates' : 'blocks locations outside the office'}`, async () => {
  const calls = [];
  const React = require('react');
  const states = [point, office, inArea, false, false, 0];
  const Component = load('src/screens/clockInAreaScreen.js', {
    react: { ...React, useState: () => [states.shift(), () => {}], useEffect() {}, useCallback: fn => fn },
    'react-native': {
      View: 'View', Text: 'Text', TouchableOpacity: 'Button', ScrollView: 'ScrollView', ActivityIndicator: 'Spinner',
      StyleSheet: { create: x => x }, Dimensions: { get: () => ({ height: 800 }) }, Alert: { alert() {} },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../components/attendanceMap': 'Map', '../components/avatar': 'Avatar', '../components/headerWithBackButton': 'Header',
    '../styles/color': { primary: '#7057FC' }, '../utils/locationServices': { getCurrentLocation() {} },
    '../services/officeService': {}, '../../store': { useAttendanceStore: () => ({ clockIn: async p => calls.push(p), isLoading: false }) },
    '../contexts/authContext': { useAuth: () => ({ user: { role: 'employee' } }) },
  }).default;
  function findButton(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'Button' && node.props.children?.props?.children === 'Clock-in') return node;
    for (const child of React.Children.toArray(node.props?.children)) { const result = findButton(child); if (result) return result; }
    return null;
  }
  const button = findButton(Component({ navigation: { goBack() {} } }));
  assert.ok(button);
  assert.equal(button.props.disabled, !inArea);
  await button.props.onPress();
  assert.deepEqual(calls, inArea ? [{ lat: point.latitude, lng: point.longitude }] : []);
});
