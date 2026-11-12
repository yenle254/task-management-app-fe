import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { getAbsoluteFileUrl } from './fileUrlHelper';
import { downloadAuthenticated } from '../services/fileService';

const getMimeType = (filename) => {
  const ext = filename?.split('.')?.pop()?.toLowerCase() || '';
  const mimeTypes = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Spreadsheets
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    // Presentations
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    // Text
    txt: 'text/plain',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

let downloadSequence = 0;

const downloadErrorMessage = (status, filename) => {
  if (status === 404 || status === 410) {
    return `"${filename}" is not available on the server (HTTP ${status}). Please ask the uploader to attach the original file again.`;
  }
  if (status === 401 || status === 403) {
    return `The server denied access to this file (HTTP ${status}). Please check your account or contact the file owner.`;
  }
  return `The server could not provide the file (HTTP ${status}). Please try again later.`;
};

export const downloadFile = async (url, filename) => {
  let tempFileUri;
  let targetUri;
  let keepTempFile = false;
  let saved = false;
  try {
    const absoluteUrl = getAbsoluteFileUrl(url);
    if (!/^https?:\/\//i.test(absoluteUrl)) {
      Alert.alert('Download Error', 'This attachment does not have a valid download URL.');
      return null;
    }
    const safeFilename = String(filename || 'download').split(/[\\/]/).pop()
      .replace(/[\x00-\x1f\x7f<>:"|?*]/g, '_').trim() || 'download';
    if (!FileSystem.cacheDirectory) throw new Error('Temporary storage is unavailable.');
    tempFileUri = `${FileSystem.cacheDirectory}download_${Date.now()}_${++downloadSequence}_${encodeURIComponent(safeFilename)}`;
    const result = await downloadAuthenticated(absoluteUrl, tempFileUri);
    if (result.status !== 200) {
      Alert.alert('Download Error', downloadErrorMessage(result.status, safeFilename));
      return null;
    }

    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return null;
      const base64Content = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        safeFilename,
        getMimeType(safeFilename)
      );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(
        targetUri,
        base64Content,
        { encoding: FileSystem.EncodingType.Base64 }
      );
      saved = true;
      Alert.alert('Successful!', `File saved to the selected folder.\n${safeFilename}`);
      return targetUri;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, {
        mimeType: getMimeType(safeFilename),
        dialogTitle: safeFilename,
      });
    } else {
      Alert.alert('Successful!', `File saved at:\n${result.uri}`);
    }
    keepTempFile = true;
    return result.uri;
  } catch (error) {
    Alert.alert('Download Error', error.message || 'Cannot download file. Please check your connection and try again.');
    return null;
  } finally {
    if (targetUri && !saved) {
      await FileSystem.StorageAccessFramework.deleteAsync(targetUri, { idempotent: true }).catch(() => {});
    }
    if (tempFileUri && !keepTempFile) {
      await FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => {});
    }
  }
};
