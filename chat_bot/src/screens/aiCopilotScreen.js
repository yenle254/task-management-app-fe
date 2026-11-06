import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/authContext';
import HeaderWithBackButton from '../../../src/components/headerWithBackButton';
import Colors from '../../../src/styles/color';
import taskService from '../../../src/services/taskService';
import leaveService from '../../../src/services/leaveService';
import aiService from '../services/aiService';
import useAICopilotStore from '../../store/aiCopilotStore';
import { ROLE_LABELS } from '../config/aiPrompts.config';
import { parseBoldSegments } from '../utils/markdownText.helper';
import AIActionCard from '../components/aiActionCard';
import { copilotScreenStyles as styles } from '../styles/aiCopilot.styles';

const AICopilotScreen = ({ navigation }) => {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);

  const {
    messages,
    quickPrompts,
    completedActions,
    ensureSession,
    appendMessage,
    setQuickPrompts,
    markActionCompleted,
    resetConversation
  } = useAICopilotStore();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [executingActionId, setExecutingActionId] = useState(null);

  useEffect(() => {
    ensureSession(user);
  }, [user, ensureSession]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleSendMessage = async (textOverride) => {
    const prompt = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!prompt || sending) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    appendMessage(userMsg);
    if (typeof textOverride !== 'string') setInputText('');
    setSending(true);
    scrollToBottom();

    try {
      const historyPayload = nextMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await aiService.askAssistant(prompt, historyPayload);
      const data = response?.data || {};

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Không thể lấy phản hồi từ Trợ lý AI.',
        provider: data.provider || 'copilot',
        proposedAction: data.proposedAction || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      appendMessage(botMsg);
      if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        setQuickPrompts(data.suggestedQuestions);
      }
      scrollToBottom();
    } catch (error) {
      Alert.alert(
        'AI Copilot',
        error?.error || error?.message || 'Không thể kết nối tới máy chủ AI Copilot'
      );
    } finally {
      setSending(false);
    }
  };

  const handleExecuteAction = async (messageId, action) => {
    if (!action || executingActionId) return;
    setExecutingActionId(messageId);

    try {
      const payload = action.payload || {};

      if (action.type === 'LOG_TIME') {
        if (!payload.taskId) {
          throw new Error('Không tìm thấy Task đang mở phù hợp để ghi nhận thời gian.');
        }
        await taskService.addTimeEntry(payload.taskId, {
          minutes: Number(payload.minutes) || 60,
          note: payload.note || 'Log time qua AI Copilot'
        });

        markActionCompleted(messageId, {
          status: 'done',
          text: `Đã ghi nhận ${payload.minutes} phút vào task "${payload.taskTitle}" thành công!`,
          taskId: payload.taskId
        });
      } else if (action.type === 'CREATE_LEAVE') {
        await leaveService.submitLeave({
          type: payload.type || 'personal',
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: payload.reason || 'Xin nghỉ phép qua AI Copilot'
        });

        markActionCompleted(messageId, {
          status: 'done',
          text: `Đã tạo và gửi đơn xin nghỉ phép (${payload.startDate} → ${payload.endDate}) thành công!`
        });
      } else if (action.type === 'CREATE_TASK_DRAFT') {
        navigation.navigate('CreateTask', {
          aiPrefill: {
            assigneeId: payload.assigneeId,
            assigneeName: payload.assigneeName,
            difficulty: payload.difficulty || 'hard',
            priority: payload.priority || 'high'
          }
        });
      }
    } catch (error) {
      Alert.alert(
        'Không thể thực thi thao tác',
        error?.error || error?.message || 'Vui lòng kiểm tra lại dữ liệu và thử lại.'
      );
    } finally {
      setExecutingActionId(null);
    }
  };

  const renderFormattedText = (content, isUser) => {
    const segments = parseBoldSegments(content);
    return (
      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
        {segments.map((seg, index) =>
          seg.bold ? (
            <Text
              key={index}
              style={[styles.boldText, isUser && styles.userMessageText]}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={index}>{seg.text}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton
        title="✨ AI HR & Task Copilot"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.roleBanner}>
        <MaterialCommunityIcons name="shield-check-outline" size={16} color={Colors.primary} />
        <Text style={styles.roleBannerText} numberOfLines={1}>
          RBAC: {ROLE_LABELS[user?.role] || user?.role} • MongoDB Live
        </Text>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => resetConversation(user)}
        >
          <Text style={styles.resetBtnText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.assistantRow
                ]}
              >
                {!isUser && (
                  <View style={styles.botAvatar}>
                    <MaterialCommunityIcons name="robot-excited-outline" size={20} color="#fff" />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.assistantBubble
                  ]}
                >
                  {renderFormattedText(msg.content, isUser)}
                  {!isUser && (
                    <AIActionCard
                      action={msg.proposedAction}
                      completed={completedActions[msg.id]}
                      isBusy={executingActionId === msg.id}
                      onConfirm={() => handleExecuteAction(msg.id, msg.proposedAction)}
                      onOpenTask={(tid) =>
                        navigation.navigate('TaskDetail', { taskId: tid })
                      }
                    />
                  )}
                  <View style={styles.metaRow}>
                    <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
                      {msg.timestamp}
                    </Text>
                    {!isUser && msg.provider && (
                      <Text style={styles.providerBadge}>{msg.provider}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {sending && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={styles.botAvatar}>
                <MaterialCommunityIcons name="robot-excited-outline" size={20} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>
                  AI Copilot đang truy vấn dữ liệu & phân tích...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.suggestionsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                disabled={sending}
                onPress={() => handleSendMessage(prompt)}
              >
                <MaterialCommunityIcons
                  name="sparkles"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.suggestionChipText} numberOfLines={1}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Hỏi về task, ngày phép, chấm công hoặc ra lệnh log time..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            disabled={!inputText.trim() || sending}
            onPress={() => handleSendMessage()}
          >
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICopilotScreen;

