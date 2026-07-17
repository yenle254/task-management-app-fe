import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Upload from '../../../assets/icons/upload.svg';
import { formatFileSize, getFileIcon } from '../../utils/fileValidation';

const AttachmentPicker = ({ 
  attachments = [], 
  onAddFiles, 
  onRemoveFile, 
  maxFiles = 3,
  maxSize = 5,
  disabled = false,
}) => {
  const handlePickFiles = async () => {
    if (disabled) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        onAddFiles(result.assets);
      }
    } catch (error) {
      console.error('File picker error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Attachment ({attachments.length}/{maxFiles})
      </Text>
      <Text style={styles.hint}>
        PDF, JPEG, PNG • Max {maxSize}MB each
      </Text>
      
      <View style={styles.row}>
        {attachments.map((att) => (
          <View key={att.id} style={styles.item}>
            <View style={styles.box}>
              <Text style={styles.icon}>{getFileIcon(att.name)}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {att.name}
              </Text>
              <Text style={styles.size}>{formatFileSize(att.size)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeBtn} 
              onPress={() => onRemoveFile(att.id)}
              disabled={disabled}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {attachments.length < maxFiles && (
          <TouchableOpacity 
            style={[styles.addBox, disabled && styles.addBoxDisabled]} 
            onPress={handlePickFiles}
            disabled={disabled}
          >
            <Upload width={24} height={24} />
            <Text style={styles.addText}>Add File</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000000', 
    marginBottom: 4 
  },
  hint: { 
    fontSize: 12, 
    color: '#999999', 
    marginBottom: 8 
  },
  row: { 
    flexDirection: 'row', 
    gap: 12, 
    flexWrap: 'wrap' 
  },
  item: { 
    position: 'relative', 
    width: 100 
  },
  box: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#6C5CE7',
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  icon: { 
    fontSize: 24, 
    marginBottom: 4 
  },
  name: { 
    fontSize: 11, 
    color: '#000000', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  size: { 
    fontSize: 10, 
    color: '#999999', 
    marginTop: 2 
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  removeText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  addBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#6C5CE7',
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBoxDisabled: {
    opacity: 0.5,
  },
  addText: { 
    fontSize: 12, 
    color: '#6C5CE7', 
    fontWeight: '600',
    marginTop: 4,
  },
});

export default AttachmentPicker;