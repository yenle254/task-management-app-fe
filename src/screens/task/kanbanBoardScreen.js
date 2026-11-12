import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import useTaskStore from '../../../store/taskStore';
import { useAuth } from '../../contexts/authContext';
import Colors from '../../styles/color';

const columns = { todo: 'To Do', in_progress: 'In progress', in_review: 'Review', done: 'Done' };
const idOf = value => value?._id || value;

const TAG_PALETTE = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF9C3', text: '#A16207' },
  { bg: '#FEE2E2', text: '#B91C1C' },
  { bg: '#F1F5F9', text: '#334155' },
];

const getTagColors = (tag, idx) => {
  const lower = String(tag || '').toLowerCase();
  if (lower.includes('design')) return TAG_PALETTE[0];
  if (lower.includes('dev')) return TAG_PALETTE[1];
  if (lower.includes('feat')) return TAG_PALETTE[2];
  if (lower.includes('bug') || lower.includes('fix')) return TAG_PALETTE[3];
  if (lower.includes('research')) return TAG_PALETTE[4];
  return TAG_PALETTE[idx % TAG_PALETTE.length];
};

const getPriorityMeta = (priority) => {
  const p = String(priority || 'medium').toLowerCase();
  if (p === 'high' || p === 'urgent') {
    return { label: p === 'urgent' ? 'Urgent' : 'High', bg: '#FEE2E2', text: '#B91C1C' };
  }
  if (p === 'low') {
    return { label: 'Low', bg: '#DCFCE7', text: '#15803D' };
  }
  return { label: 'Medium', bg: '#FEF3C7', text: '#B45309' };
};

const formatCardDate = (dueDate) => {
  if (!dueDate) return 'No deadline';
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return 'No deadline';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function PlusMiniIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M8 3.333v9.334M3.333 8h9.334" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function TrashMiniIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M2.667 4.667h10.666M6 4.667V3.333a.667.667 0 0 1 .667-.666h2.666a.667.667 0 0 1 .667.666v1.334m1.333 0v8a1.333 1.333 0 0 1-1.333 1.333H6a1.333 1.333 0 0 1-1.333-1.333v-8h6.666Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditMiniIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2Z" stroke="#1E293B" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarMiniIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
      <Rect x={2} y={3} width={12} height={11} rx={2} stroke="#DC2626" strokeWidth={1.5} />
      <Path d="M2 6.5h12M5.333 1.667v2.666M10.667 1.667v2.666" stroke="#DC2626" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function DraggableCard({ task, enabled, onDrop, onDrag, onMove, onOpen, onEdit, onDelete }) {
  const x = useSharedValue(0), y = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  const callbacks = useRef({ task, onDrag, onDrop, onMove, onOpen });
  callbacks.current = { task, onDrag, onDrop, onMove, onOpen };
  // Drag updates re-render the board. Keep recognizers stable during the gesture
  // and let Pan win over Tap, so releasing a dragged card cannot open details.
  const gesture = useMemo(() => {
    const pan = Gesture.Pan().enabled(enabled).activateAfterLongPress(180).runOnJS(true)
      .onStart(() => callbacks.current.onDrag(true))
      .onUpdate(event => { x.value = event.translationX; y.value = event.translationY; callbacks.current.onMove(callbacks.current.task, event.absoluteX, event.absoluteY); })
      .onEnd(event => callbacks.current.onDrop(callbacks.current.task, event.absoluteX, event.absoluteY))
      .onFinalize(() => { x.value = 0; y.value = 0; callbacks.current.onDrag(false); });
    const tap = Gesture.Tap().runOnJS(true).onEnd((_event, success) => { if (success) callbacks.current.onOpen(); });
    return Gesture.Exclusive(pan, tap);
  }, [enabled, x, y]);

  const priorityMeta = getPriorityMeta(task.priority);
  const tags = Array.isArray(task.tags) && task.tags.length > 0 ? task.tags : [];

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={task.title}
        onAccessibilityTap={onOpen}
        style={[styles.card, style]}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{task.title}</Text>
          </View>
          <View style={styles.cardActionsStack}>
            <TouchableOpacity
              style={styles.cardEditBtn}
              onPress={onEdit}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <EditMiniIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardDeleteBtn}
              onPress={onDelete}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <TrashMiniIcon />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {task.description || `${task.priority || 'medium'} · ${task.progress || 0}% completed`}
        </Text>

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, idx) => {
              const tagColor = getTagColors(tag, idx);
              return (
                <View key={`${tag}-${idx}`} style={[styles.tagPill, { backgroundColor: tagColor.bg }]}>
                  <Text style={[styles.tagPillText, { color: tagColor.text }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.cardFooterRow}>
          <View style={[styles.priorityPill, { backgroundColor: priorityMeta.bg }]}>
            <Text style={[styles.priorityPillText, { color: priorityMeta.text }]}>
              {priorityMeta.label}
            </Text>
          </View>

          <View style={styles.dateMeta}>
            <CalendarMiniIcon />
            <Text style={[styles.dateText, task.overdue && styles.dateTextOverdue]}>
              {formatCardDate(task.dueDate)}
            </Text>
          </View>
        </View>

        {enabled && <Text style={styles.dragHint}>Hold and drag to change status</Text>}
      </Animated.View>
    </GestureDetector>
  );
}

export default function KanbanBoardScreen({ navigation, route }) {
  const { user, canManageTasks } = useAuth();
  const { taskBoard, getBoard, updateTaskStatus, deleteTask } = useTaskStore();
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [includeSubtasks, setIncludeSubtasks] = useState(false), [dragging, setDragging] = useState(false);
  const refs = useRef({});
  const root = useRef(null);
  const rootOffset = useRef({ x: 0, y: 0 });
  const [floating, setFloating] = useState(null);
  const pending = useRef(false);
  const teamId = route.params?.teamId || idOf(user.teamId);
  const load = useCallback(async () => {
    if (!canManageTasks()) return;
    setLoading(true); setError('');
    try { await getBoard({ ...(teamId ? { teamId } : {}), includeSubtasks }); }
    catch (err) { setError(err?.error || 'Could not load board'); }
    finally { setLoading(false); }
  }, [teamId, includeSubtasks, getBoard, canManageTasks]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDeleteTask = (task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task._id);
            await load();
          } catch (err) {
            Alert.alert('Error', err?.error || 'Could not delete task');
          }
        },
      },
    ]);
  };

  const drop = async (task, x, y) => {
    if (pending.current) return;
    pending.current = true;
    try {
      const bounds = await Promise.all(Object.keys(columns).map(status => new Promise(resolve => {
        const column = refs.current[status];
        if (!column) return resolve(null);
        column.measureInWindow((left, top, width, height) => resolve({ status, left, top, width, height }));
      })));
      const target = bounds.find(box => box && x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height);
      if (target && (!['todo', 'in_progress'].includes(target.status) || !['todo', 'in_progress'].includes(task.status))) { Alert.alert('Review', 'Submit and review from the task details screen.'); return; }
      if (target && target.status !== task.status) { await updateTaskStatus(task._id, target.status); await load(); }
    } catch (err) { Alert.alert('Status', err?.error || 'Could not move task'); }
    finally { pending.current = false; }
  };

  return (
    <SafeAreaView
      ref={root}
      onLayout={() => root.current?.measureInWindow((x, y) => { rootOffset.current = { x, y }; })}
      style={styles.screen}
    >
      <HeaderWithBackButton title="Kanban board" onBackPress={() => navigation.goBack()} />
      {!canManageTasks() ? (
        <Text style={styles.permissionText}>Only HR and Team Leads can view this board.</Text>
      ) : (
        <>
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.filterToggle, includeSubtasks && styles.filterToggleActive]}
              onPress={() => setIncludeSubtasks(!includeSubtasks)}
            >
              <Text style={[styles.filterToggleText, includeSubtasks && styles.filterToggleTextActive]}>
                {includeSubtasks ? '☑' : '☐'} Include child tasks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshBtn} onPress={load}>
              <Text style={styles.refreshBtnText}>Refresh board</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator color="#FFFFFF" size="small" />}
          </View>

          {!!error && (
            <TouchableOpacity style={styles.errorBanner} onPress={load}>
              <Text style={styles.errorText}>{error} · Retry</Text>
            </TouchableOpacity>
          )}

          <ScrollView
            horizontal
            scrollEnabled={!dragging}
            showsHorizontalScrollIndicator={false}
            style={styles.boardScroll}
            contentContainerStyle={styles.boardScrollContent}
          >
            {Object.entries(columns).map(([status, title]) => (
              <View
                key={status}
                ref={ref => { refs.current[status] = ref; }}
                collapsable={false}
                style={styles.columnCard}
              >
                <View style={styles.columnHeader}>
                  <Text style={styles.columnTitle}>
                    {title} ({taskBoard[status]?.length || 0})
                  </Text>
                  <View style={styles.columnHeaderActions}>
                    <TouchableOpacity
                      style={styles.columnAddBtn}
                      onPress={() => navigation.navigate('CreateTask')}
                    >
                      <PlusMiniIcon />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.columnClearBtn}
                      onPress={load}
                    >
                      <TrashMiniIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  scrollEnabled={!dragging}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={styles.columnList}
                  contentContainerStyle={styles.columnListContent}
                >
                  {!taskBoard[status]?.length && (
                    <View style={styles.emptyColumnBox}>
                      <Text style={styles.emptyColumnText}>No tasks</Text>
                    </View>
                  )}
                  {(taskBoard[status] || []).map(task => (
                    <DraggableCard
                      key={task._id}
                      task={task}
                      onDrag={active => { setDragging(active); if (!active) setFloating(null); }}
                      onDrop={drop}
                      onMove={(item, x, y) => setFloating({ task: item, x: x - rootOffset.current.x, y: y - rootOffset.current.y })}
                      enabled={
                        !loading &&
                        ['todo', 'in_progress'].includes(task.status) &&
                        (user.role === 'hr_manager' ||
                          idOf(task.assignedBy) === user._id ||
                          task.assignedTo.some(person => idOf(person) === user._id))
                      }
                      onOpen={() => navigation.navigate('TaskDetail', { taskId: task._id })}
                      onEdit={() => {
                        if (task.status === 'in_review') {
                          navigation.navigate('TaskDetail', { taskId: task._id });
                        } else {
                          navigation.navigate('EditTask', { taskId: task._id });
                        }
                      }}
                      onDelete={() => handleDeleteTask(task)}
                    />
                  ))}
                </ScrollView>

                <View style={styles.columnFooterDash} />
              </View>
            ))}
          </ScrollView>
        </>
      )}
      {floating && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingCard,
            { left: floating.x - 110, top: floating.y - 30 },
          ]}
        >
          <Text style={styles.floatingCardText} numberOfLines={1}>
            {floating.task.title}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#5B67CA',
  },
  permissionText: {
    padding: 20,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterToggle: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  filterToggleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterToggleTextActive: {
    color: '#4338CA',
  },
  refreshBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  boardScroll: {
    flex: 1,
    minHeight: 0,
  },
  boardScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
    gap: 16,
    alignItems: 'stretch',
  },
  columnCard: {
    width: 288,
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  columnHeader: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  columnHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnAddBtn: {
    width: 28,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#5B6CE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnClearBtn: {
    width: 28,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#F26B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnList: {
    flex: 1,
    minHeight: 0,
  },
  columnListContent: {
    paddingBottom: 4,
  },
  emptyColumnBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyColumnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  columnFooterDash: {
    flexShrink: 0,
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#5B6CE2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitleWrap: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardActionsStack: {
    flexDirection: 'column',
    gap: 5,
  },
  cardEditBtn: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDeleteBtn: {
    width: 34,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#F26B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#64748B',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B91C1C',
  },
  dateTextOverdue: {
    fontWeight: '700',
    color: '#991B1B',
  },
  dragHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#94A3B8',
  },
  floatingCard: {
    position: 'absolute',
    width: 220,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#5B6CE2',
    elevation: 20,
    zIndex: 999,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  floatingCardText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
