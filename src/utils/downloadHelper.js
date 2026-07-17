import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

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

export const downloadFile = async (url, filename) => {
  try {
    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (!permissions.granted) {
        Alert.alert('Permission denied', 'Cannot save file');
        return;
      }
      const tempFileUri = FileSystem.cacheDirectory + 'temp_' + Date.now() + '_' + filename;
      const downloadResult = await FileSystem.downloadAsync(url, tempFileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      const base64Content = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        getMimeType(filename)
      );

      await FileSystem.StorageAccessFramework.writeAsStringAsync(
        targetUri,
        base64Content,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      try {
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      } catch (e) {
        console.log('Failed to delete temp file:', e);
      }

      Alert.alert('Successful!', `File saved to Downloads!\n${filename}`);
      return targetUri;
    } 

    const fileUri = `${FileSystem.cacheDirectory}${encodeURIComponent(filename)}`;
    const result = await FileSystem.downloadAsync(url, fileUri);

    if (result.status !== 200) throw new Error('Download failed');

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, {
        mimeType: getMimeType(filename),
        dialogTitle: filename,
      });
    } else {
      Alert.alert('Successful!', `File saved at:\n${result.uri}`);
    }

    return result.uri;
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Error', error.message || 'Cannot download file');
    return null;
  }
};