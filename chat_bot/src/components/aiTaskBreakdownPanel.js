import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../src/styles/color';
import taskService from '../../../src/services/taskService';
import aiService from '../services/aiService';
import { breakdownPanelStyles as styles } from '../styles/aiCopilot.styles';

/**
 * Reusable AI Task Copilot Panel for CreateTaskScreen (mode="create")
 * and TaskDetailScreen (mode="detail")
 */
const AITaskBreakdownPanel = ({
  mode = 'create',
  title = '',
  description = '',
  task = null,
  canManage = false,
  locked = false,
  onApplyBreakdown,
  onTaskUpdated
}) => {
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [applyingBreakdown, setApplyingBreakdown] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  const handleGenerateBreakdown = async () => {
    const targetTitle = (mode === 'detail' ? task?.title : title)?.trim();
    const targetDesc = (mode === 'detail' ? task?.description : description) || '';

    if (!targetTitle) {
      Alert.alert(
        'AI Gợi ý Subtasks',
        'Vui lòng nhập Tiêu đề công việc (Task title) trước khi sử dụng AI gợi ý.'
      );
      return;
    }

    setLoadingBreakdown(true);
    try {
      const response = await aiService.breakdownTask({
        title: targetTitle,
        description: targetDesc
      });
      setBreakdownResult(response?.data || null);
    } catch (error) {
      Alert.alert(
        'AI Copilot',
        error?.error || error?.message || 'Không thể sinh gợi ý Subtasks lúc này.'
      );
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleApplyInCreateMode = () => {
    if (!breakdownResult) return;
    if (onApplyBreakdown) {
      onApplyBreakdown(breakdownResult);
    }
    Alert.alert(
      '✨ Đã áp dụng gợi ý AI',
      `Đã điền ${breakdownResult.subTasks?.length || 0} subtasks, checklist "${breakdownResult.checklist?.title || ''}", ước lượng ${breakdownResult.estimatedMinutes} phút (${breakdownResult.storyPoints} Story Points) vào biểu mẫu!`
    );
  };

  const handleApplyInDetailMode = async () => {
    if (!breakdownResult || !task?._id || applyingBreakdown) return;
    setApplyingBreakdown(true);
    try {
      for (const st of breakdownResult.subTasks || []) {
        if (st.title) {
          await taskService.createSubtask(task._id, st.title);
        }
      }

      if (breakdownResult.checklist?.title) {
        const clRes = await taskService.addChecklist(
          task._id,
          breakdownResult.checklist.title
        );
        const updatedChecklists = clRes?.data?.checklists || [];
        const newChecklist = updatedChecklists[updatedChecklists.length - 1];
        if (newChecklist?._id && Array.isArray(breakdownResult.checklist.items)) {
          for (const itemText of breakdownResult.checklist.items) {
            await taskService.addChecklistItem(task._id, newChecklist._id, itemText);
          }
        }
      }

      if (task.estimatedMinutes == null && breakdownResult.estimatedMinutes != null) {
        await taskService.updateEstimate(task._id, {
          estimatedMinutes: breakdownResult.estimatedMinutes,
          storyPoints: breakdownResult.storyPoints ?? 3
        });
      }

      setBreakdownResult(null);
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
      Alert.alert(
        'Thành công',
        'Đã thêm Subtasks, Checklist và Ước lượng thời gian từ AI vào Task!'
      );
    } catch (error) {
      Alert.alert(
        'Lỗi cập nhật Task',
        error?.error || error?.message || 'Không thể lưu gợi ý AI vào Task.'
      );
    } finally {
      setApplyingBreakdown(false);
    }
  };

  const handleSummarizeTask = async () => {
    if (!task?._id || loadingSummary) return;
    setLoadingSummary(true);
    try {
      const response = await aiService.summarizeTask(task._id);
      setSummaryResult(response?.data || null);
    } catch (error) {
      Alert.alert(
        'AI Tóm tắt Task',
        error?.error || error?.message || 'Không thể tóm tắt tình trạng Task.'
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.buttonsRow}>
        {mode === 'detail' && (
          <TouchableOpacity
            style={styles.summaryButton}
            disabled={loadingSummary}
            onPress={handleSummarizeTask}
          >
            {loadingSummary ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="text-box-check-outline"
                size={18}
                color={Colors.primary}
              />
            )}
            <Text style={styles.summaryButtonText}>📋 Tóm tắt tình trạng Task</Text>
          </TouchableOpacity>
        )}

        {(mode === 'create' || (canManage && !locked)) && (
          <TouchableOpacity
            style={styles.breakdownButton}
            disabled={loadingBreakdown}
            onPress={handleGenerateBreakdown}
          >
            {loadingBreakdown ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="auto-fix" size={18} color="#fff" />
            )}
            <Text style={styles.breakdownButtonText}>
              ✨ AI Gợi ý Subtasks & Checklist
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {summaryResult && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📋 Báo cáo Tóm tắt Tình trạng Task (AI)</Text>
            <TouchableOpacity onPress={() => setSummaryResult(null)}>
              <Text style={styles.closeText}>Đóng ✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headlineText}>{summaryResult.headline}</Text>
          <Text style={styles.bodyText}>{summaryResult.statusAnalysis}</Text>

          <Text style={styles.subHeading}>⛔ Điểm nghẽn / Phụ thuộc (Blockers):</Text>
          {(summaryResult.blockers || []).map((b, idx) => (
            <Text key={idx} style={styles.bulletText}>
              • {b}
            </Text>
          ))}

          <Text style={styles.subHeading}>🕒 Hoạt động & Bình luận gần nhất:</Text>
          <Text style={styles.bodyText}>{summaryResult.recentActivitySummary}</Text>

          <Text style={styles.subHeading}>🚀 Đề xuất bước tiếp theo:</Text>
          {(summaryResult.nextSteps || []).map((step, idx) => (
            <Text key={idx} style={styles.bulletText}>
              {idx + 1}. {step}
            </Text>
          ))}
        </View>
      )}

      {breakdownResult && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>✨ Đề xuất Chia nhỏ & Ước lượng từ AI</Text>
            <TouchableOpacity onPress={() => setBreakdownResult(null)}>
              <Text style={styles.closeText}>Đóng ✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Độ khó: {String(breakdownResult.difficulty || 'medium').toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Ưu tiên: {String(breakdownResult.priority || 'medium').toUpperCase()}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                ⏱ {breakdownResult.estimatedMinutes} phút ({breakdownResult.storyPoints} SP)
              </Text>
            </View>
          </View>

          {!!breakdownResult.reasoning && (
            <Text style={styles.reasoningText}>{breakdownResult.reasoning}</Text>
          )}

          <Text style={styles.subHeading}>
            📌 Subtasks đề xuất ({breakdownResult.subTasks?.length || 0}):
          </Text>
          {(breakdownResult.subTasks || []).map((st, idx) => (
            <Text key={idx} style={styles.bulletText}>
              {idx + 1}. {st.title}
            </Text>
          ))}

          {breakdownResult.checklist && (
            <>
              <Text style={styles.subHeading}>
                ☑️ {breakdownResult.checklist.title}:
              </Text>
              {(breakdownResult.checklist.items || []).map((item, idx) => (
                <Text key={idx} style={styles.bulletText}>
                  • {item}
                </Text>
              ))}
            </>
          )}

          <TouchableOpacity
            style={[styles.applyButton, applyingBreakdown && { opacity: 0.6 }]}
            disabled={applyingBreakdown}
            onPress={
              mode === 'create' ? handleApplyInCreateMode : handleApplyInDetailMode
            }
          >
            {applyingBreakdown ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyButtonText}>
                {mode === 'create'
                  ? '✓ Áp dụng Subtasks, Checklist & Ước lượng vào Biểu mẫu'
                  : '✓ Lưu Subtasks & Checklist này vào Task'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AITaskBreakdownPanel;

