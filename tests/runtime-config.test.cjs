const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveApiConfig } = require('../src/config/runtime-url');
const origin = 'https://api-production-360b0645.up.railway.app';
test('API prefix is added once and hostname api- is retained for socket/files', () => {
  for (const input of [origin, origin+'/', origin+'/api', origin+'/api/']) {
    const config = resolveApiConfig(input);
    assert.equal(config.BASE_URL, origin+'/api');
    assert.equal(config.ORIGIN, origin);
    assert.equal(new URL('/api/files/example.pdf', config.ORIGIN).href, origin+'/api/files/example.pdf');
  }
});
test('release rejects missing, insecure, local or ambiguous endpoints', () => {
  for (const input of [undefined, '', 'http://api.example.com', 'https://localhost', 'https://localhost.', 'https://dev.localhost.', 'https://test.local', 'https://127.0.0.1', 'https://10.0.2.2', 'https://192.168.1.3', 'https://[::1]', origin+'/other', origin+'?token=x', origin+'#x', 'https://u:p@api.example.com', 'invalid'])
    assert.throws(() => resolveApiConfig(input));
});
test('development supports emulator and explicitly configured LAN URLs', () => {
  assert.equal(resolveApiConfig('', false).BASE_URL, 'http://10.0.2.2:3000/api');
  assert.equal(resolveApiConfig('http://192.168.1.3:3000/api', false).ORIGIN, 'http://192.168.1.3:3000');
});
test('EAS release profile and Expo identity remain compatible', () => {
  const app = require('../app.json').expo;
  const profile = require('../eas.json').build['production-apk'];
  assert.equal(profile.developmentClient, false);
  assert.equal(profile.android.buildType, 'apk');
  assert.equal(profile.environment, 'production');
  assert.equal(resolveApiConfig(profile.env.EXPO_PUBLIC_API_URL).ORIGIN, origin);
  const firebase = require('../google-services.json');
  assert(firebase.client.some(c => c.client_info.android_client_info.package_name === app.android.package));
});
