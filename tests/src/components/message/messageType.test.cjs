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

function findByType(node, type, acc = []) {
  if (Array.isArray(node)) node.forEach((child) => findByType(child, type, acc));
  else if (node && typeof node === 'object' && node.props) {
    if (node.type === type) acc.push(node);
    findByType(node.props.children, type, acc);
  }
  return acc;
}

test('MessageType supports text send, gallery image pick, camera capture, and FormData upload across all roles', async () => {
  const sentMessages = [];
  const uploadedPayloads = [];
  const states = ['Hello team', 'file:///cache/photo.JPG', 56, false];
  const setters = [];

  const MessageType = loadModule('src/components/message/messageType.js', {
    react: {
      ...React,
      useState: (initial) => {
        const idx = setters.length;
        if (states[idx] === undefined) states[idx] = initial;
        const set = (v) => { states[idx] = v; };
        setters.push(set);
        return [states[idx], set];
      },
      useRef: (v) => ({ current: v }),
    },
    'react-native': {
      View: 'View',
      TextInput: 'TextInput',
      TouchableOpacity: 'TouchableOpacity',
      Image: 'Image',
      ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: (s) => s },
    },
    '../../components/appIcon': 'AppIcon',
    '../../styles/color': { primary: '#7057FC', danger: '#ff0000', gray: '#999', white: '#fff', frame: '#eee' },
    'expo-image-picker': {
      requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
      launchImageLibraryAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///gallery/pic.png' }] }),
      requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
      launchCameraAsync: async () => ({ canceled: false, assets: [{ uri: 'file:///camera/snap.jpg' }] }),
    },
    '../../services/tokenManager': {
      getValidAccessToken: async () => 'jwt-token',
      authorizedFetch: async (url, opts) => {
        uploadedPayloads.push({ url, opts });
        return { ok: true, status: 200, json: async () => ({ url: '/uploads/photo.jpg' }) };
      },
    },
    '../../config/runtime-api.config': { API_URL: 'https://api.example.test/api' },
  }).default;

  const tree = MessageType({
    receiverId: 'user-2',
    onSendMessage: (text, attachments) => sentMessages.push({ text, attachments }),
  });

  const sendButton = findByType(tree, 'AppIcon').find((n) => typeof n.props.onPress === 'function' && n.props.width === 56);
  assert.ok(sendButton);
  await sendButton.props.onPress();

  assert.equal(uploadedPayloads.length, 1);
  assert.equal(uploadedPayloads[0].url, 'https://api.example.test/api/upload');
  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].text, 'Hello team');
  assert.deepEqual(sentMessages[0].attachments, [
    { type: 'image', url: '/uploads/photo.jpg', name: 'photo.JPG' },
  ]);

  const touchables = findByType(tree, 'TouchableOpacity');
  await touchables[touchables.length - 2].props.onPress();
  assert.equal(states[1], 'file:///gallery/pic.png');
  await touchables[touchables.length - 1].props.onPress();
  assert.equal(states[1], 'file:///camera/snap.jpg');
});

