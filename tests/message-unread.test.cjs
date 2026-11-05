const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

function load(file, mocks) {
  const filename = path.resolve(__dirname, '..', file);
  const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
  }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(name =>
    Object.hasOwn(mocks, name) ? mocks[name] : require(name), mod, mod.exports);
  return mod.exports.default;
}
const store = getUnreadCount => load('store/messageStore.js', {
  '../src/services/messageService': { getUnreadCount },
});
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('concurrent badge refreshes send only one request', async () => {
  const pending = deferred(); let calls = 0;
  const s = store(() => { calls++; return pending.promise; });
  const first = s.getState().fetchUnreadCount();
  await s.getState().fetchUnreadCount();
  assert.equal(calls, 1);
  pending.resolve({ data: { unreadCount: 4 } }); await first;
  assert.equal(s.getState().unreadCount, 4);
  assert.equal(s.getState().isFetchingUnread, false);
});

test('429 preserves count, suppresses repeated requests and resumes after cooldown', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const errors = t.mock.method(console, 'error', () => {});
  let calls = 0;
  const s = store(async () => {
    calls++;
    if (calls === 1) throw { error: 'Too many requests. Please try again later.', retryAfter: 900 };
    return { data: { unreadCount: 2 } };
  });
  s.setState({ unreadCount: 7 });
  await s.getState().fetchUnreadCount();
  assert.equal(s.getState().unreadCount, 7);
  assert.equal(s.getState().unreadCooldownUntil, 901000);
  t.mock.timers.tick(899999);
  await s.getState().fetchUnreadCount(); assert.equal(calls, 1);
  t.mock.timers.tick(1);
  await s.getState().fetchUnreadCount(); assert.equal(calls, 2);
  assert.equal(s.getState().unreadCount, 2);
  assert.equal(errors.mock.callCount(), 0);
});

test('an old account response cannot overwrite the new account count or request lock', async () => {
  const a = deferred(), b = deferred(); let calls = 0;
  const s = store(() => ++calls === 1 ? a.promise : b.promise);
  const first = s.getState().fetchUnreadCount();
  s.getState().reset();
  const second = s.getState().fetchUnreadCount();
  a.resolve({ data: { unreadCount: 99 } }); await first;
  assert.equal(s.getState().unreadCount, 0);
  assert.equal(s.getState().isFetchingUnread, true);
  b.resolve({ data: { unreadCount: 3 } }); await second;
  assert.equal(s.getState().unreadCount, 3);
});

test('an old account 429 does not put the new account into cooldown', async () => {
  const pending = deferred();
  const s = store(() => pending.promise);
  const request = s.getState().fetchUnreadCount();
  s.getState().reset();
  pending.reject({ retryAfter: 900 }); await request;
  assert.equal(s.getState().unreadCooldownUntil, 0);
});

test('unexpected failures remain visible and release the request lock', async t => {
  const errors = t.mock.method(console, 'error', () => {});
  const s = store(async () => { throw { error: 'Network unavailable' }; });
  await s.getState().fetchUnreadCount();
  assert.equal(errors.mock.callCount(), 1);
  assert.equal(s.getState().isFetchingUnread, false);
});

test('badge unregisters its socket listener and clears polling on unmount', t => {
  const effects = [], focusEffects = [], listeners = new Set();
  let calls = 0;
  const fetchUnreadCount = () => { calls++; };
  const interval = t.mock.method(global, 'setInterval', () => 123);
  const clear = t.mock.method(global, 'clearInterval', () => {});
  const Badge = load('src/components/home/messageBadge.js', {
    react: { useEffect: fn => effects.push(fn), useCallback: fn => fn },
    '@react-navigation/native': { useFocusEffect: fn => focusEffects.push(fn) },
    'react-native': { StyleSheet: { create: s => s } },
    '../../../store/messageStore': selector => selector({ unreadCount: 0, fetchUnreadCount }),
    '../../services/socketService': {
      onMessageNotification: cb => listeners.add(cb),
      off: (event, cb) => { assert.equal(event, 'message_notification'); listeners.delete(cb); },
    },
  });
  Badge();
  const cleanup = effects.map(fn => fn());
  const blur = focusEffects.map(fn => fn());
  assert.equal(calls, 1);
  assert.equal(listeners.size, 1);
  assert.equal(interval.mock.callCount(), 1);
  for (const cb of listeners) cb();
  assert.equal(calls, 2);
  cleanup.forEach(fn => fn()); blur.forEach(fn => fn());
  assert.equal(listeners.size, 0);
  assert.deepEqual(clear.mock.calls[0].arguments, [123]);
});
