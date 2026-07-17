import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import socketService from '../../services/socketService';

const OnlineBadge = ({ userId, style }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!userId) return;

    const handleUserOnline = (data) => {
      if (data.userId === userId.toString() || data.userId === userId) {
        setIsOnline(true);
      }
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data) => {
      if (data.userId === userId.toString() || data.userId === userId) {
        setIsOnline(false);
      }
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
      const userIdStr = userId.toString();
      setIsOnline(userIds.includes(userIdStr) || userIds.includes(userId));
    };

    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);
    socketService.onOnlineUsers(handleOnlineUsers);

    return () => {
      socketService.off('user_online', handleUserOnline);
      socketService.off('user_offline', handleUserOffline);
      socketService.off('online_users', handleOnlineUsers);
    };
  }, [userId]);

  return (
    <View style={[styles.badge, isOnline ? styles.online : styles.offline, style]} />
  );
};

export default OnlineBadge;

const styles = StyleSheet.create({
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  online: {
    backgroundColor: '#1bc144ff',
  },
  offline: {
    backgroundColor: '#999999',
  },
});