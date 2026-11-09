import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getValidAccessToken, refreshAccessToken, authorizedFetch, getAuthGeneration, expireSession } from './tokenManager';
import { getAbsoluteFileUrl, isPrivateFileUrl } from '../utils/fileUrlHelper';
export const getFileRequest = async fileUrl => {
  const url = getAbsoluteFileUrl(fileUrl);
  if (!isPrivateFileUrl(url)) return { url, options: {} };
  const token = await getValidAccessToken();
  if (!token) throw new Error('Please sign in to download this file.');
  const parsed = new URL(url);
  parsed.searchParams.delete('access_token');
  return { url: parsed.toString(), options: { headers: { Authorization: `Bearer ${token}` } } };
};
export const downloadAuthenticated = async (url, destination) => {
  const generation = getAuthGeneration();
  let request = await getFileRequest(url);
  let result = await FileSystem.downloadAsync(request.url, destination, request.options);
  if (result.status === 401 && isPrivateFileUrl(url) && generation === getAuthGeneration() && process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED !== 'false') {
    await refreshAccessToken(request.options.headers.Authorization.slice(7));
    if (generation !== getAuthGeneration()) throw new Error('Session changed');
    request = await getFileRequest(url);
    result = await FileSystem.downloadAsync(request.url, destination, request.options);
    if (result.status === 401) await expireSession(request.options.headers.Authorization.slice(7));
  }
  return result;
};
let sequence = 0;
const previews = new Set();
export const releasePreview = async uri => {
  if (!previews.delete(uri)) return;
  if (Platform.OS === 'web') URL.revokeObjectURL(uri);
  else await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
};
export const clearPreviews = () => Promise.all([...previews].map(releasePreview));
export const getPreviewUrl = async fileUrl => {
  const url = getAbsoluteFileUrl(fileUrl);
  if (!isPrivateFileUrl(url)) return url;
  const generation = getAuthGeneration();
  const request = await getFileRequest(url);
  let uri;
  if (Platform.OS === 'web') {
    const result = await authorizedFetch(request.url);
    if (!result.ok) throw new Error('Unable to load attachment');
    uri = URL.createObjectURL(await result.blob());
  } else {
    const extension = new URL(request.url).pathname.split('.').pop().replace(/[^a-z0-9]/gi, '');
    uri = `${FileSystem.cacheDirectory}private_preview_${Date.now()}_${++sequence}.${extension}`;
    try {
      const result = await downloadAuthenticated(url, uri);
      if (result.status !== 200) throw new Error('Unable to load attachment');
    } catch (error) { await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}); throw error; }
  }
  previews.add(uri);
  if (generation !== getAuthGeneration()) { await releasePreview(uri); throw new Error('Session changed'); }
  return uri;
};
