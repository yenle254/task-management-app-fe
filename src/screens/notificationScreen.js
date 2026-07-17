import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrashIcon from '../../assets/icons/trash.svg';
import useNotificationStore from '../../store/notificationStore';
import HeaderWithBackButton from '../components/headerWithBackButton';
import Colors from '../styles/color';
import Noti_IC from "../../assets/icons/noti_ic.svg"

const NotificationScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
    refresh,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      startAutoRefresh();
      return () => stopAutoRefresh();
    }, [refresh, startAutoRefresh, stopAutoRefresh])
  );

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };


  const handlePress = async (item) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    if (item.relatedId) {
      const taskId = typeof item.relatedId === 'object' ? item.relatedId._id : item.relatedId;

      if (item.type.includes('task')) {
        navigation.navigate('Main', {
          screen: 'task',
          params: {
            screen: 'TaskDetail',
            params: { taskId }
          }
        });
      } else if (item.type.includes('leave')) {
        navigation.navigate('Main', {
          screen: 'leave'
        });
      }
    }
  };


  const handleDelete = (id) => {
    deleteNotification(id);
  };


  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };


  const getIcon = (type) => {
    return <Noti_IC width={28} height={28} />;
  };

  const sections = useMemo(() => {
    const groups = { today: [], yesterday: [], thisWeek: [], older: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notif) => {
      const date = new Date(notif.createdAt);
      if (date >= today) {
        groups.today.push(notif);
      } else if (date >= yesterday) {
        groups.yesterday.push(notif);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    const result = [];
    if (groups.today.length) result.push({ title: 'Today', data: groups.today });
    if (groups.yesterday.length) result.push({ title: 'Yesterday', data: groups.yesterday });
    if (groups.thisWeek.length) result.push({ title: 'This Week', data: groups.thisWeek });
    if (groups.older.length) result.push({ title: 'Older', data: groups.older });
    
    return result;
  }, [notifications]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.unreadItem]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getIcon(item.type)}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <TrashIcon width={20} height={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );


  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Noti_IC width={64} height={64} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyMessage}>You're all caught up!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderWithBackButton
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
        onBackPress={() => navigation.goBack()}
      />

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[Colors.primary]} 
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.secondary 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: '#F4F3FF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconContainer: { 
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { 
    flex: 1,
    marginRight: 8,
  },
  title: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1f2937',
    marginBottom: 4,
  },
  message: { 
    fontSize: 13.5, 
    color: '#666', 
    lineHeight: 19,
    marginBottom: 6,
  },
  time: { 
    fontSize: 12, 
    color: '#999' 
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginHorizontal: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: Colors.secondary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40,
    marginBottom: 80
  },
  emptyIcon: { 
    fontSize: 64, 
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1f2937',
    marginBottom: 8 
  },
  emptyMessage: { 
    fontSize: 14, 
    color: '#888', 
    textAlign: 'center' 
  },
});

export default NotificationScreen;