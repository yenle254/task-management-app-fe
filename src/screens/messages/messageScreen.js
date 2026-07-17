import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import Colors from "../../styles/color";
import HeaderWithBackButton from "../../components/headerWithBackButton";
import ChatThread from "../../components/message/chatThread";
import messageService from "../../services/messageService";
import socketService from "../../services/socketService";
import { useAuth } from "../../contexts/authContext";
import { useFocusEffect } from '@react-navigation/native';

const MessageScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return formatDistanceToNow(messageDate, { addSuffix: true });
    }
  };

  const loadConversations = async () => {
    try {
      const response = await messageService.getConversations();
      
      if (response && response.success) {
        const conversationsData = response.data || [];
        
        const formattedConversations = conversationsData.map(conv => ({
          id: conv._id,
          conversationId: conv._id,
          name: conv.participant?.profile?.fullName || conv.participant?.email || 'Unknown',
          lastMessage: conv.lastMessage || 'No messages yet',
          time: formatTime(conv.lastMessageAt),
          unreadCount: conv.unreadCount || 0,
          participant: conv.participant,
          userId: conv.participant?._id,
          lastMessageAt: conv.lastMessageAt,
          profile: conv.participant?.profile,
          email: conv.participant?.email
        }));
        
        formattedConversations.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return dateB - dateA;
        });
        
        setConversations(formattedConversations);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  useEffect(() => {
    const initSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        const handleMessageNotification = (data) => {
          loadConversations();
        };

        const handleNewMessage = (data) => {
          loadConversations();
        };

        socketService.onMessageNotification(handleMessageNotification);
        socketService.onNewMessage(handleNewMessage);

        return () => {
          socketService.off('message_notification', handleMessageNotification);
          socketService.off('new_message', handleNewMessage);
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initSocket();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const handleThreadPress = (thread) => {
    navigation.navigate('Chat', { 
      threadName: thread.name,
      threadId: thread.id,
      conversationId: thread.conversationId,
      receiverId: thread.participant?._id
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <HeaderWithBackButton title="Messages" onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HeaderWithBackButton title="Messages" onBackPress={() => navigation.goBack()} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with your colleagues</Text>
          </View>
        ) : (
          conversations.map(thread => (
            <ChatThread
              key={thread.id}
              thread={thread}
              onPress={() => handleThreadPress(thread)}
            />
          ))
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewMessage')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

