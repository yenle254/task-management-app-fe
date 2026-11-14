import apiClient from './api';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { avatarFile } from '../utils/avatarData';

export const uploadAvatar = async asset => {
  let fileSize = asset?.fileSize ?? asset?.file?.size;
  if (fileSize == null && Platform.OS !== 'web' && asset?.uri) {
    const info = await FileSystem.getInfoAsync(asset.uri);
    if (!info.exists || typeof info.size !== 'number') throw new Error('Unable to read selected photo.');
    fileSize = info.size;
  }
  const file = avatarFile({ ...asset, fileSize });
  const data = new FormData();
  data.append('file', Platform.OS === 'web' && asset.file ? asset.file : file);
  const response = await apiClient.post('/upload', data);
  if (!response.success || !response.url) throw new Error(response.error || 'Photo upload failed.');
  return response.url;
};
