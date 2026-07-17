import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator  } from "react-native";
import AppIcon from "../../components/appIcon";
import Send from "../../../assets/icons/send.svg";
import Attach from "../../../assets/icons/attach.svg";
import Camera from "../../../assets/icons/cam.svg";
import Colors from "../../styles/color";
import Micro from "../../../assets/icons/micro.svg";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";
import { getToken } from "../../utils/authStorage";
import { API_URL } from "../../config/api.config";

const MessageType = ({ onSendMessage, onTyping, disabled, receiverId, conversationId }) => {
  const [message, setMessage] = React.useState("");
  const [image, setImage] = React.useState(null);
  const [tiHeight, setTiHeight] = React.useState(MIN_HEIGH);
  const typingTimeoutRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const MIN_HEIGH = 56
  const MAX_HEIGH = 120

  const handleSend = async () => {
    const txt = message.trim();
    if ((!txt && !image) || disabled || uploading) return;

    try {
      if (image) {
        console.log('Sending message with image...');
        await sendMessageWithImage(txt);
      } else {
        onSendMessage?.(txt);
      }

      setMessage("");
      setImage(null);
      setTiHeight(MIN_HEIGH);

      if (onTyping) {
        onTyping(false);
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const sendMessageWithImage = async (text) => {
    if (!receiverId) {
      alert("Cannot send message: No receiver specified");
      return;
    }

    setUploading(true);
    try {
      console.log('Uploading image:', image);
      const attachmentUrl = await uploadImage(image);
      console.log('Image uploaded, URL:', attachmentUrl);
      
      const attachments = [{
        type: 'image',
        url: attachmentUrl,
        name: image.split('/').pop()
      }];
      onSendMessage?.(text || '', attachments);
    } catch (error) {
      console.error("Send message with image error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const uploadImage = async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type
    });

    try {
      const token = await getToken();
      const baseUrl = API_URL.replace('/api', '');
      const uploadUrl = `${baseUrl}/api/upload`;
      
      console.log('Upload URL:', uploadUrl);
      console.log('Uploading file:', { filename, type });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Image upload failed');
      }

      const data = await response.json();
      console.log('Upload success, response data:', data);
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  const handleChangeText = (text) => {
    setMessage(text);
    
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const pickImage = async () => {
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (mediaLibraryStatus !== 'granted') {
        alert('Sorry, we need camera and media library permissions to make this work!');
        return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    })

    if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        console.log('Image selected:', imageUri);
    }
  }

  const takePhoto = async () => {
    const { status: cameraStatus} = await ImagePicker.requestCameraPermissionsAsync();

    if (cameraStatus !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
    }

    let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    })

    if (!result.canceled) {
        console.log(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.container}>
      {image && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          {!uploading && (
            <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
              <AppIcon icon={<Send width={16} height={16} />} width={24} height={24} color={Colors.danger} />
            </TouchableOpacity>
          )}
          {uploading && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.uploadingIndicator} />
          )}
        </View>
      )}


      <View style={styles.inputWrap}>
        <TextInput
          style={styles.textInput}
          value={message}
          placeholder="Type a message..."
          placeholderTextColor="#9AA3B2"
          onChangeText={handleChangeText}
          multiline={true}
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!disabled && !uploading}
        />
        <TouchableOpacity onPress={pickImage} style={styles.actionIconButton} disabled={disabled || uploading}>
          <Attach width={20} height={20} style={[styles.actionIcon, (disabled || uploading) && styles.disabled]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={styles.actionIconButton} disabled={disabled || uploading}>
          <Camera width={20} height={20} style={[styles.actionIcon, (disabled || uploading) && styles.disabled]} />
        </TouchableOpacity>
      </View>
      { (message.trim().length > 0 || image) ? (
        <AppIcon
        icon={<Send width={20} height={20} />}
        width={56}
        height={56}
        color={disabled || uploading ? Colors.gray : Colors.primary}
        onPress={handleSend}
        disabled={disabled || uploading}
      />
      ) : (
        <AppIcon
        icon={<Micro width={20} height={20} />}
        width={56}
        height={56}
        color={Colors.primary}
        disabled={disabled || uploading}
      />
      )}
    </View>
  );
};

export default MessageType;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  inputWrap: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.frame,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  actionIconButton: {
    marginLeft: 12,
    padding: 4,
  },
  actionIcon: {
    opacity: 0.65,
  },
  sendBtn: {
    alignSelf: "flex-end",
  },
  disabled: {
    opacity: 0.3,
  },
  imagePreview: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 10,
  },
  uploadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  }

});
