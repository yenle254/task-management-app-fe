import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import socketService from './socketService';
import { inAppEnabled } from '../utils/notificationTarget';

const TARGET_KEY = 'pendingNotificationTarget';
let generation = 0, activeUser = null, responseSubscription, tokenSubscription, socketUnsubscribe;
let registration = null, targetHandler = null, lastResponseId = null;
let consumingTarget = false;
const native = () => Platform.OS !== 'web';

async function handleResponse(response) {
  const request = response?.notification?.request;
  if (!request || request.identifier === lastResponseId) return;
  const data = request.content?.data;
  if (!data?.type && !data?.target) return;
  lastResponseId = request.identifier;
  await AsyncStorage.setItem(TARGET_KEY, JSON.stringify(data));
  targetHandler?.();
}
export async function consumePendingTarget(userId) {
  if (consumingTarget) return null;
  consumingTarget = true;
  try {
  const saved = await AsyncStorage.getItem(TARGET_KEY);
  if (!saved) return null;
  await AsyncStorage.removeItem(TARGET_KEY);
  try {
    const data = JSON.parse(saved);
    // Payloads are scoped to an account; never navigate to another account's notification.
    return data.userId && String(data.userId) !== String(userId) ? null : data;
  } catch { return null; }
  } finally { consumingTarget = false; }
}
export function setTargetHandler(handler) { targetHandler = handler; }
export async function permissionGranted() {
  if (!native()) return false;
  const permission = await Notifications.getPermissionsAsync();
  return Boolean(permission.granted || (Platform.OS === 'ios' && permission.ios &&
    permission.ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL));
}
export async function registerPushToken(requestPermission = false, devicePushToken) {
  if (!activeUser || !native()) return false;
  if (registration) {
    // Explicit opt-in must run after a silent startup check, not inherit its refusal.
    if (!requestPermission && !devicePushToken) return registration;
    const session = generation;
    await registration;
    if (session !== generation) return false;
    return registerPushToken(requestPermission, devicePushToken);
  }
  const session = generation;
  const request = (async () => {
    try {
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications', importance: Notifications.AndroidImportance.DEFAULT
      });
      if (!await permissionGranted()) {
        if (!requestPermission) return false;
        await Notifications.requestPermissionsAsync();
        if (!await permissionGranted()) return false;
      }
      if (Constants.appOwnership === 'expo') return false;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) return false;
      const token = await Notifications.getExpoPushTokenAsync({ projectId, ...(devicePushToken ? { devicePushToken } : {}) });
      if (session !== generation) return false;
      await apiClient.post('/notifications/push-token', { token: token.data, platform: Platform.OS });
      return session === generation;
    } catch { return false; } // Expo Go, offline, denied permission: in-app delivery remains available.
  })();
  registration = request;
  try { return await request; } finally { if (registration === request) registration = null; }
}
export async function showForegroundNotification(notification, preferences) {
  if (!activeUser || !native() || AppState.currentState !== 'active' || !preferences?.master ||
      !inAppEnabled(preferences, notification.type)) return;
  const session = generation;
  if (!await permissionGranted() || session !== generation) return;
  await Notifications.scheduleNotificationAsync({ content: {
    title: notification.title, body: notification.message, sound: preferences.sound ? 'default' : false,
    data: { type: notification.type, relatedId: notification.relatedId, userId: String(activeUser) }
  }, trigger: null });
}
export function stopNotificationManager() {
  generation++; activeUser = null;
  responseSubscription?.remove(); tokenSubscription?.remove(); socketUnsubscribe?.();
  responseSubscription = null; tokenSubscription = null; socketUnsubscribe = null;
}
export function initNotificationManager(userId, onNotification, getPreferences) {
  stopNotificationManager();
  activeUser = userId;
  const session = generation;
  socketUnsubscribe = socketService.onNotificationCreated(({ notification }) => {
    if (session === generation && notification && String(notification.userId) === String(userId)) onNotification(notification);
  });
  if (!native()) return;
  Notifications.setNotificationHandler({ handleNotification: async notification => {
    const prefs = getPreferences();
    const data = notification?.request?.content?.data;
    const sameAccount = !data?.userId || String(data.userId) === String(activeUser);
    const enabled = sameAccount && session === generation && inAppEnabled(prefs, data?.type);
    return { shouldShowBanner: enabled, shouldShowList: enabled, shouldPlaySound: enabled && !!prefs?.sound, shouldSetBadge: false };
  } });
  responseSubscription = Notifications.addNotificationResponseReceivedListener(response => { if (session === generation) handleResponse(response).catch(() => {}); });
  if (Constants.appOwnership !== 'expo') tokenSubscription = Notifications.addPushTokenListener(token => {
    // Pass the provided native token; do not recursively request a new native token in this callback.
    registerPushToken(false, token);
  });
  Notifications.getLastNotificationResponseAsync().then(response => { if (session === generation) return handleResponse(response); }).catch(() => {});
  registerPushToken();
}
export async function cleanupNotifications(unregister = true) {
  const pending = registration;
  stopNotificationManager();
  await pending?.catch(() => {});
  if (unregister) await apiClient.delete('/notifications/push-token').catch(() => {});
  await AsyncStorage.removeItem(TARGET_KEY);
  lastResponseId = null;
  if (native()) await Promise.allSettled([
    Notifications.dismissAllNotificationsAsync(), Notifications.cancelAllScheduledNotificationsAsync(),
    Notifications.clearLastNotificationResponseAsync(), Notifications.setBadgeCountAsync(0)
  ]);
}
