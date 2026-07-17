import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useNotificationStore from '../../../store/notificationStore';


const NotificationBadge = () => {
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const fetchUnreadCount = useNotificationStore(state => state.fetchUnreadCount);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 3000);
      
      return () => clearInterval(interval);
    }, [fetchUnreadCount])
  );

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

export default NotificationBadge;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    zIndex: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});