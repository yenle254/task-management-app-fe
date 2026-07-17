import React, { useState, useEffect, useRef, useCallback } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import HeaderWithBackButton from "../../components/headerWithBackButton";
import MessageBubble from "../../components/message/messageBubble";
import MessageType from "../../components/message/messageType";
import Colors from "../../styles/color";
import socketService from "../../services/socketService";
import messageService from "../../services/messageService";
import { useAuth } from "../../contexts/authContext";
import TypingIndicator from "@/src/components/message/typingIndicator";
import useMessageStore from "../../../store/messageStore";


const ChatScreen = ({ navigation, route }) => {
  const { threadName, threadId, conversationId: initialConversationId, receiverId } = route?.params || {};
  const { user } = useAuth();
  const markAsRead = useMessageStore(state => state.markAsRead);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const scrollViewRef = useRef();
  const typingTimeoutRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      let convId = conversationId;
      
      if (!convId && receiverId) {
        try {
          const response = await messageService.getConversationByUser(receiverId);
          if (response && response.success) {
            convId = response.data._id;
            setConversationId(convId);
          }
        } catch (error) {
          console.log('No existing conversation, will create on first message');
          setLoading(false);
          return;
        }
      }

      if (convId) {
        const response = await messageService.getMessages(convId);
        if (response && response.success) {
          const formattedMessages = response.data.map(msg => ({
            _id: msg._id,
            message: msg.message,
            isOwn: msg.senderId._id === user._id,
            time: format(new Date(msg.createdAt), 'h:mm a'),
            timestamp: msg.createdAt,
            senderId: msg.senderId._id,
            senderName: msg.senderId.profile?.fullName || msg.senderId.email,
            attachments: msg.attachments,
            isRead: msg.isRead
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, receiverId, user]);

  useEffect(() => {
    const initSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        if (conversationId) {
          socketService.joinConversation(conversationId);
        }

        const handleNewMessage = (data) => {
          if (data.conversationId === conversationId) {
            const newMsg = {
              _id: data.message._id,
              message: data.message.message,
              isOwn: data.message.senderId._id === user._id,
              time: format(new Date(data.message.createdAt), 'h:mm a'),
              timestamp: data.message.createdAt,
              senderId: data.message.senderId._id,
              senderName: data.message.senderId.profile?.fullName || data.message.senderId.email,
              attachments: data.message.attachments || [],
              isRead: data.message.isRead
            };
            
            setMessages(prev => {
              const exists = prev.some(m => m._id === newMsg._id);
              if (exists) {
                return prev;
              }
              
              if (newMsg.isOwn && data.tempId) {
                return prev.map(m => m._id === data.tempId ? newMsg : m);
              }
              
              return [...prev, newMsg];
            });
                        
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        };

        const handleMessageSent = (data) => {
          if (data.conversationId && !conversationId) {
            setConversationId(data.conversationId);
            socketService.joinConversation(data.conversationId);
          }
          
          if (data.tempId && data.message) {
            setMessages(prev => prev.map(m => {
              if (m._id === data.tempId) {
                return {
                  _id: data.message._id,
                  message: data.message.message,
                  isOwn: true,
                  time: format(new Date(data.message.createdAt), 'h:mm a'),
                  timestamp: data.message.createdAt,
                  senderId: data.message.senderId._id || data.message.senderId,
                  senderName: data.message.senderId.profile?.fullName || data.message.senderId.email || user.profile?.fullName || user.email,
                  attachments: data.message.attachments || [],
                  isRead: data.message.isRead,
                  sending: false
                };
              }
              return m;
            }));
          }
        };

        const handleUserTyping = (data) => {
          if (data.conversationId === conversationId && data.userId !== user._id) {
            setTypingUsers(prev => new Set(prev).add(data.userId));
          }
        };

        const handleUserStopTyping = (data) => {
          if (data.conversationId === conversationId) {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        };

        socketService.onNewMessage(handleNewMessage);
        socketService.onMessageSent(handleMessageSent);
        socketService.onUserTyping(handleUserTyping);
        socketService.onUserStopTyping(handleUserStopTyping);

        return () => {
          if (conversationId) {
            socketService.leaveConversation(conversationId);
          }
          socketService.off('new_message', handleNewMessage);
          socketService.off('message_sent', handleMessageSent);
          socketService.off('user_typing', handleUserTyping);
          socketService.off('user_stop_typing', handleUserStopTyping);
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initSocket();
  }, [conversationId, user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const hasMarkedAsRead = useRef(false);
  
  useEffect(() => {
    if (!loading && conversationId && messages.length > 0 && socketService.isConnected() && !hasMarkedAsRead.current) {
      const timer = setTimeout(() => {
        socketService.markAsRead(conversationId);
        markAsRead(conversationId);
        hasMarkedAsRead.current = true;
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, conversationId, messages.length, markAsRead]);
  
  useEffect(() => {
    hasMarkedAsRead.current = false;
  }, [conversationId]);

  const handleSendMessage = async (text, attachments = []) => {
    
    if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) return;
    if (!receiverId) return;

    try {
      setSending(true);

      const tempId = `temp_${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        message: text || '',
        isOwn: true,
        time: format(new Date(), 'h:mm a'),
        timestamp: new Date().toISOString(),
        senderId: user._id,
        senderName: user.profile?.fullName || user.email,
        attachments: attachments || [],
        isRead: false,
        sending: true
      };

      setMessages(prev => [...prev, tempMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (socketService.isConnected()) {
        socketService.sendMessage({
          receiverId,
          message: text || '',
          attachments: attachments || [],
          conversationId,
          tempId
        });
      } else {
        console.log('Socket not connected, using HTTP API');
        const response = await messageService.sendMessage(receiverId, text || '', attachments || []);
        if (response && response.success) {
          setMessages(prev => {
            const filtered = prev.filter(m => m._id !== tempId);
            const newMsg = {
              _id: response.data._id,
              message: response.data.message,
              isOwn: true,
              time: format(new Date(response.data.createdAt), 'h:mm a'),
              timestamp: response.data.createdAt,
              senderId: response.data.senderId._id,
              senderName: response.data.senderId.profile?.fullName || response.data.senderId.email,
              attachments: response.data.attachments,
              isRead: response.data.isRead
            };
            return [...filtered, newMsg];
          });

          if (response.conversationId && !conversationId) {
            setConversationId(response.conversationId);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => !m.sending));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (isTyping) => {
    if (!conversationId || !receiverId) return;

    if (isTyping) {
      socketService.startTyping(conversationId, receiverId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(conversationId, receiverId);
      }, 3000);
    } else {
      socketService.stopTyping(conversationId, receiverId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderWithBackButton
          title={threadName || "Chat"}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderWithBackButton
        title={threadName || "Chat"}
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg.message}
                isOwn={msg.isOwn}
                time={msg.time}
                attachments={msg.attachments}
              />
            ))
          )}
          
          {typingUsers.size > 0 && (
            <View style={styles.typingIndicator}>
                {Array.from(typingUsers).map((userId) => (
                  <TypingIndicator 
                    key={userId}
                    userName={"User"}
                  />
                ))}
            </View>
          )}
        </ScrollView>

        <MessageType 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={sending}
          receiverId={receiverId}
          conversationId={conversationId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.secondary,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: Colors.gray,
    fontStyle: 'italic',
  },
});

