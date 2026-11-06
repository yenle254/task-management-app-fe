import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../src/styles/color';
import { actionCardStyles as styles } from '../styles/aiCopilot.styles';

const AIActionCard = ({
  action,
  completed,
  isBusy,
  onConfirm,
  onOpenTask
}) => {
  if (!action || !action.type || action.type === 'NONE') return null;

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionCardHeader}>
        <MaterialCommunityIcons
          name={
            action.type === 'LOG_TIME'
              ? 'clock-check-outline'
              : action.type === 'CREATE_LEAVE'
                ? 'calendar-check-outline'
                : 'account-arrow-right-outline'
          }
          size={20}
          color={Colors.primary}
        />
        <Text style={styles.actionCardTitle}>
          {action.type === 'LOG_TIME'
            ? 'Thao tác nhanh: Ghi nhận thời gian (Log Time)'
            : action.type === 'CREATE_LEAVE'
              ? 'Thao tác nhanh: Gửi đơn xin nghỉ phép'
              : 'Đề xuất điều phối công việc'}
        </Text>
      </View>

      <Text style={styles.actionCardSummary}>{action.summary}</Text>

      {completed ? (
        <View style={styles.completedBox}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#15803d" />
          <Text style={styles.completedText}>{completed.text}</Text>
          {completed.taskId && onOpenTask && (
            <TouchableOpacity
              style={styles.openTaskLink}
              onPress={() => onOpenTask(completed.taskId)}
            >
              <Text style={styles.openTaskLinkText}>Xem Task →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.confirmActionButton, isBusy && { opacity: 0.6 }]}
          disabled={isBusy}
          onPress={onConfirm}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fff" />
              <Text style={styles.confirmActionButtonText}>
                {action.type === 'CREATE_TASK_DRAFT'
                  ? 'Mở màn hình Tạo Task cho nhân sự này'
                  : 'Xác nhận thực hiện'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AIActionCard;

