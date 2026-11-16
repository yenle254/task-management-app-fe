const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

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
    return require(name);
  }, mod, mod.exports);
  return mod.exports;
}

test('useNotificationStore loads notifications, updates unread count, marks as read, and resets cleanly on logout', async () => {
  const notifServiceMock = {
    getNotifications: async () => ({ data: [{ _id: 'n1', isRead: false }, { _id: 'n2', isRead: true }] }),
    getUnreadCount: async () => ({ data: { unreadCount: 1 } }),
    markAsRead: async (id) => ({ data: { _id: id, isRead: true } }),
    markAllAsRead: async () => ({ success: true }),
    deleteNotification: async () => ({ success: true }),
  };
  const useNotificationStore = loadModule('store/notificationStore.js', {
    '../src/services/notificationService': notifServiceMock,
  }).default;

  await useNotificationStore.getState().fetchNotifications({ page: 1, limit: 20 });
  assert.equal(useNotificationStore.getState().notifications.length, 2);

  await useNotificationStore.getState().fetchUnreadCount();
  assert.equal(useNotificationStore.getState().unreadCount, 1);

  await useNotificationStore.getState().markAsRead('n1');
  assert.equal(useNotificationStore.getState().notifications[0].isRead, true);

  useNotificationStore.getState().reset();
  assert.equal(useNotificationStore.getState().notifications.length, 0);
  assert.equal(useNotificationStore.getState().unreadCount, 0);
});

