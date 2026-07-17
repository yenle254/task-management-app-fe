import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import useMessageStore from '../../../store/messageStore';
import socketService from '../../services/socketService';


const MessageBadge = () => {
    const unreadCount = useMessageStore(state => state.unreadCount);
    const fetchUnreadCount = useMessageStore(state => state.fetchUnreadCount);
    
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        const initSocket = async () => {
            try {
                if (!socketService.isConnected()) {
                    await socketService.connect();
                }

                const handleMessageNotification = () => {
                    fetchUnreadCount();
                };

                socketService.onMessageNotification(handleMessageNotification);

                return () => {
                    socketService.off('message_notification', handleMessageNotification);
                };
            } catch (error) {
                console.error('MessageBadge socket error:', error);
            }
        };

        initSocket();
    }, [fetchUnreadCount]);


    useFocusEffect(
        React.useCallback(() => {
            fetchUnreadCount();
            const interval = setInterval(() => {
                fetchUnreadCount();
            }, 30000);

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
    )
}


export default MessageBadge;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: 53,
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
})
