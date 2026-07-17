import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "../../styles/color";
import { API_URL } from "../../config/api.config";

const MessageBubble = ({ message, isOwn, time, attachments = [] }) => {
  const hasAttachments = attachments && attachments.length > 0;
  const hasText = message && message.trim().length > 0;

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {hasAttachments && attachments.map((attachment, index) => (
          <View key={index} style={styles.attachmentContainer}>
            {attachment.type === 'image' && (
              <TouchableOpacity activeOpacity={0.9}>
                <Image
                  source={{ uri: getFullImageUrl(attachment.url) }}
                  style={styles.imageAttachment}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {hasText && (
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {message}
          </Text>
        )}
        
        <Text style={[styles.timeText, isOwn ? styles.ownTimeText : styles.otherTimeText]}>
          {time}
        </Text>
      </View>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  ownContainer: {
    alignItems: "flex-end",
  },
  otherContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.frame,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownText: {
    color: "#FFFFFF",
  },
  otherText: {
    color: "#000000",
  },
  timeText: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  ownTimeText: {
    color: "#FFFFFF",
    opacity: 0.8,
  },
  otherTimeText: {
    color: "#666666",
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});

