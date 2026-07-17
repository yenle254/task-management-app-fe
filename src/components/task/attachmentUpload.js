import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Upload from '../../../assets/icons/upload.svg';
import Colors from '../../styles/color';

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '🎯';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return '🖼️';
    case 'mp4':
    case 'mov':
    case 'avi':
      return '🎥';
    case 'zip':
    case 'rar':
    case '7z':
      return '📦';
    case 'txt':
    case 'csv':
      return '📋';
    case 'mp3':
    case 'wav':
      return '🎵';
    default:
      return '📎';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const AttachmentUpload = ({ attachments, onAttachmentsChange }) => {
    const handleAttachmentPress = async () => {
    try {
      console.log("📂 Opening file picker...");
      
      let result;
      
      try {
        result = await DocumentPicker.getDocumentAsync({
          type: ['*/*'],
          multiple: true,
          copyToCacheDirectory: true,
        });
        
                if (!result || result.type === undefined || (result.type === 'success' && (!result.files || result.files.length === 0))) {
          throw new Error("DocumentPicker returned empty or undefined");
        }
      } catch (docError) {
        console.log("DocumentPicker not available, trying ImagePicker:", docError.message);
        
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Need media library access');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsMultiple: true,
          quality: 1,
        });
        
        console.log("ImagePicker cancelled:", result.canceled);
        
        if (!result.canceled && result.assets) {
          result = {
            type: 'success',
            files: result.assets.map(asset => ({
              uri: asset.uri,
              name: asset.filename || `file-${Date.now()}`,
              size: asset.fileSize || 0,
              mimeType: asset.type,
            }))
          };
          console.log("Converted to DocumentPicker format, files:", result.files.length);
        } else {
          result = { type: 'cancel', files: [] };
        }
      }

      if (result.type === 'success' && result.files && result.files.length > 0) {
        console.log("Selected files:", result.files.length);
        
        const newFiles = result.files
          .map((file) => {
            if (file.size && file.size > 5 * 1024 * 1024) {
              Alert.alert("Error", `${file.name} exceeds 5MB limit`);
              return null;
            }

            return {
              id: `${Date.now()}-${Math.random()}`,
              uri: file.uri,
              name: file.name,
              size: file.size || 0,
              mimeType: file.mimeType,
            };
          })
          .filter(Boolean);

        if (newFiles.length === 0) {
          console.log("No valid files");
          return;
        }

        if (attachments.length + newFiles.length > 10) {
          Alert.alert(
            "Error",
            `Maximum 10 attachments allowed. You can add ${10 - attachments.length} more.`
          );
          return;
        }

        console.log("Adding files:", newFiles.length);
        onAttachmentsChange([...attachments, ...newFiles]);
      } else {
        console.log("Picker cancelled");
      }
    } catch (error) {
      console.error("Error picking files:", error);
      Alert.alert("Error", "Failed to pick files. Try again.");
    }
  };

  const removeAttachment = (id) => {
    onAttachmentsChange(attachments.filter(attachment => attachment.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Attachments ({attachments.length}/10)
      </Text>
      <Text style={styles.hint}>
        Supported: PDF, Images, Videos, Documents, Archives (Max 5MB each)
      </Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={handleAttachmentPress}
        activeOpacity={0.7}
      >
        <Upload width={24} height={24} />
        <Text style={styles.uploadText}>
          {attachments.length === 0 ? 'Upload Files' : 'Add More Files'}
        </Text>
        <Text style={styles.uploadSubtext}>
          or tap to browse
        </Text>
      </TouchableOpacity>

      {attachments.length > 0 && (
        <View style={styles.list}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.item}>
              <View style={styles.itemContent}>
                <Text style={styles.icon}>
                  {getFileIcon(attachment.name)}
                </Text>
                <View style={styles.info}>
                  <Text 
                    style={styles.itemName}
                    numberOfLines={1}
                  >
                    {attachment.name}
                  </Text>
                  <Text style={styles.itemSize}>
                    {formatFileSize(attachment.size)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeAttachment(attachment.id)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default AttachmentUpload;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  hint: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 4,
  },
  uploadBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    backgroundColor: "#F4F3FF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "400",
  },
  list: {
    gap: 8,
    marginTop: 8,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F4F3FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8D5FF",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  info: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemSize: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "400",
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});