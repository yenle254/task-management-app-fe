/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

// Use installed Babel with Node's test runner; no new runtime/test dependencies.
function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(__dirname, '..', filename);
    if (Object.hasOwn(mocks, absolute)) return mocks[absolute];
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = babel.transformSync(fs.readFileSync(absolute, 'utf8'), {
      filename: absolute, babelrc: false, configFile: false,
      plugins: ['@babel/plugin-transform-modules-commonjs', '@babel/plugin-transform-react-jsx'],
    }).code;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('.svg')) return () => null;
      return name.startsWith('.') ? load(path.resolve(path.dirname(absolute), name.endsWith('.js') ? name : `${name}.js`)) : require(name);
    };
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const testLoad = loader();
const { avatarFile, resolveAvatar, profileError } = testLoad('src/utils/avatarData.js');

test('selected Android photo maps to multipart image with normalized JPEG filename', () => {
  assert.deepEqual(avatarFile({ uri: 'content://media/73', mimeType: 'image/jpeg', fileSize: 100 }), { uri: 'content://media/73', type: 'image/jpeg', name: 'avatar.jpg' });
  assert.equal(avatarFile({ uri: 'file:///crop.PNG' }).type, 'image/png');
  assert.throws(() => avatarFile({ uri: 'file:///large.jpg', fileSize: 5242881 }), /5MB/);
  assert.throws(() => avatarFile({ uri: 'file:///image.heic', mimeType: 'image/heic' }), /JPG or PNG/);
});

test('current profile overrides cached copies on other screens, including previously absent avatar', () => {
  const user = { _id: 'a', profile: { fullName: 'Current', avatar: 'https://api.example/new.png' } };
  for (const id of ['a', { _id: 'a' }]) assert.equal(resolveAvatar({ userId: id, url: null }, user).url, user.profile.avatar);
  assert.equal(resolveAvatar({ userId: 'a', url: 'https://old.test/a' }, { ...user, profile: {} }).url, null);
  assert.equal(resolveAvatar({ userId: 'b', url: 'https://other.test/b' }, user).url, 'https://other.test/b');
  assert.equal(resolveAvatar({ url: 'https://preview.test/new' }, user).url, 'https://preview.test/new');
});

test('validation displays field messages instead of only Validation failed', () => {
  assert.equal(profileError({ error: 'Validation failed', errors: [{ message: 'Invalid phone' }] }), 'Invalid phone');
});

test('avatar upload sends file bytes as multipart before returning persisted URL', async () => {
  const original = global.FormData;
  const submissions = [];
  global.FormData = class { constructor() { this.parts = []; } append(...args) { this.parts.push(args); } };
  try {
    const service = loader({
      [path.resolve(__dirname, '../src/services/api.js')]: { post: async (url, data) => { submissions.push({ url, parts: data.parts }); return { success: true, url: 'https://api.example/uploads/a.png' }; } },
      'react-native': { Platform: { OS: 'android' } },
      'expo-file-system/legacy': { getInfoAsync: async () => ({ exists: true, size: 1024 }) },
    })('src/services/avatarService.js');
    assert.equal(await service.uploadAvatar({ uri: 'file:///selected.png' }), 'https://api.example/uploads/a.png');
    assert.deepEqual(submissions, [{ url: '/upload', parts: [['file', { uri: 'file:///selected.png', type: 'image/png', name: 'avatar.png' }]] }]);
    await assert.rejects(service.uploadAvatar({ uri: 'file:///large.jpg', fileSize: 6000000 }), /5MB/);
    assert.equal(submissions.length, 1);
  } finally { global.FormData = original; }
});

test('failed server upload never returns a local URI as an avatar', async () => {
  const original = global.FormData;
  global.FormData = class { append() {} };
  try {
    const service = loader({
      [path.resolve(__dirname, '../src/services/api.js')]: { post: async () => ({ success: false, error: 'Storage unavailable' }) },
      'react-native': { Platform: { OS: 'android' } },
      'expo-file-system/legacy': {},
    })('src/services/avatarService.js');
    await assert.rejects(service.uploadAvatar({ uri: 'file:///photo.jpg', fileSize: 10 }), /Storage unavailable/);
  } finally { global.FormData = original; }
});

test('Avatar follows profile context changes and releases the previous authenticated preview', async () => {
  let current = { _id: 'a', profile: { fullName: 'User', avatar: 'https://api.example/uploads/new.png' } };
  const values = [], effects = [], pending = [], released = [], requests = [];
  let cursor = 0;
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: initial => {
      const slot = cursor++;
      if (!(slot in values)) values[slot] = initial;
      return [values[slot], value => { values[slot] = value; }];
    },
    useEffect: (run, deps) => {
      const slot = cursor++;
      if (!effects[slot] || deps.some((d, i) => d !== effects[slot].deps[i])) {
        effects[slot]?.cleanup?.();
        effects[slot] = { deps };
        pending.push(() => { effects[slot].cleanup = run(); });
      }
    },
  };
  const Avatar = loader({
    react: React,
    'react-native': { Image: 'Image', View: 'View', Text: 'Text', StyleSheet: { create: value => value } },
    [path.resolve(__dirname, '../src/contexts/authContext.js')]: { useAuth: () => ({ user: current }) },
    [path.resolve(__dirname, '../src/utils/avatarMapping.js')]: { AvatarMap: {}, DefaultAvatar: 'DefaultAvatar' },
    [path.resolve(__dirname, '../src/services/fileService.js')]: {
      getPreviewUrl: async url => { requests.push(url); return 'file:///cache/' + url.split('/').pop(); },
      releasePreview: async uri => { released.push(uri); },
    },
  })('src/components/avatar.js').default;
  const render = () => {
    cursor = 0;
    const tree = Avatar({ userId: 'a', url: 'https://api.example/uploads/stale.png', name: 'Cached' });
    pending.splice(0).forEach(run => run());
    return tree;
  };
  render();
  await new Promise(setImmediate);
  assert.equal(render().props.children[0].props.source.uri, 'file:///cache/new.png');
  current = { ...current, profile: { ...current.profile, avatar: 'https://api.example/uploads/updated.png' } };
  render();
  await new Promise(setImmediate);
  assert.equal(render().props.children[0].props.source.uri, 'file:///cache/updated.png');
  assert.deepEqual(requests, ['https://api.example/uploads/new.png', 'https://api.example/uploads/updated.png']);
  assert.deepEqual(released, ['file:///cache/new.png']);
  effects.forEach(effect => effect?.cleanup?.());
  assert.deepEqual(released, ['file:///cache/new.png', 'file:///cache/updated.png']);
});
