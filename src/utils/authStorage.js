import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
const KEY = 'taskflow.credentials';
let SecureStore = null;
if (Platform.OS !== 'web' && (!globalThis.expo?.modules || globalThis.expo.modules.ExpoSecureStore)) {
  try { SecureStore = require('expo-secure-store'); } catch { SecureStore = null; }
}
const canUseSecure = async () => {
  if (Platform.OS === 'web' || !SecureStore || typeof SecureStore.getItemAsync !== 'function') return false;
  return typeof SecureStore.isAvailableAsync === 'function' ? Boolean(await SecureStore.isAvailableAsync()) : true;
};
// Atomic pair in encrypted native storage; fall back when running on web or in an unbuilt dev client.
const read = async () => !(await canUseSecure()) ? AsyncStorage.getItem(KEY) : SecureStore.getItemAsync(KEY);
const write = async value => !(await canUseSecure()) ? AsyncStorage.setItem(KEY, value) : SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
const remove = async () => !(await canUseSecure()) ? AsyncStorage.removeItem(KEY) : SecureStore.deleteItemAsync(KEY);
let queue = Promise.resolve();
export const withAuthLock = action => { const run = async () => { await initialized; return action(); }; const task = queue.then(run, run); queue = task.catch(() => {}); return task; };
const initialized = (async () => {
  const stored = await read();
  if (stored) return;
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;
  const pair = { token, refreshToken: await AsyncStorage.getItem('refreshToken') };
  await write(JSON.stringify(pair));
  await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
})();
// Observe native read errors without swallowing them for callers.
initialized.catch(() => {});
export const getCredentials = async () => { await initialized; const value = await read(); return value ? JSON.parse(value) : null; };
export const saveCredentials = async pair => {
  await write(JSON.stringify({ token: pair.token, refreshToken: pair.refreshToken || null }));
  await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
};
export const getToken = async () => (await getCredentials())?.token || null;
export const getRefreshToken = async () => (await getCredentials())?.refreshToken || null;
export const saveToken = token => withAuthLock(async () => saveCredentials({ ...await getCredentials(), token }));
export const removeToken = () => withAuthLock(remove);
export const saveUser = user => AsyncStorage.setItem('user', JSON.stringify(user));
export const getUser = async () => { const value = await AsyncStorage.getItem('user'); return value ? JSON.parse(value) : null; };
export const clearAuth = async () => { await remove(); await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']); };
export default { saveToken, getToken, removeToken, saveUser, getUser, clearAuth };
