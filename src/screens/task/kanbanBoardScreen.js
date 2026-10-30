import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import useTaskStore from '../../../store/taskStore';
import { useAuth } from '../../contexts/authContext';
import Colors from '../../styles/color';

const columns = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const idOf = value => value?._id || value;
function DraggableCard({ task, enabled, onDrop, onDrag, onMove, onOpen }) {
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
  return <GestureDetector gesture={gesture}><Animated.View accessible accessibilityRole="button" accessibilityLabel={task.title} onAccessibilityTap={onOpen}
    style={[{ backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 10 }, style]}>
    <View><Text style={{ fontWeight: '600' }}>{task.title}</Text>
      <Text>{task.priority} · {task.progress || 0}%</Text>
      <Text style={{ color: task.overdue ? '#b42318' : '#666' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</Text>
      {enabled && <Text style={{ color: '#777', fontSize: 12 }}>Hold and drag to change status</Text>}
    </View>
  </Animated.View></GestureDetector>;
}
export default function KanbanBoardScreen({ navigation, route }) {
  const { user, canManageTasks } = useAuth();
  const { taskBoard, getBoard, updateTaskStatus } = useTaskStore();
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
      if (target && target.status !== task.status) { await updateTaskStatus(task._id, target.status); await load(); }
    } catch (err) { Alert.alert('Status', err?.error || 'Could not move task'); }
    finally { pending.current = false; }
  };
  return <SafeAreaView ref={root} onLayout={() => root.current?.measureInWindow((x, y) => { rootOffset.current = { x, y }; })} style={{ flex: 1, backgroundColor: Colors.secondary }}>
    <HeaderWithBackButton title="Kanban board" onBackPress={() => navigation.goBack()} />
    {!canManageTasks() ? <Text>Only HR and Team Leads can view this board.</Text> : <>
      <TouchableOpacity onPress={() => setIncludeSubtasks(!includeSubtasks)} style={{ padding: 16 }}><Text>{includeSubtasks ? '☑' : '☐'} Include child tasks</Text></TouchableOpacity>
      <TouchableOpacity onPress={load} style={{ paddingHorizontal: 16 }}><Text style={{ color: Colors.primary }}>Refresh board</Text></TouchableOpacity>
      {loading && <ActivityIndicator />}
      {!!error && <TouchableOpacity onPress={load}><Text style={{ padding: 16, color: '#b42318' }}>{error} · Retry</Text></TouchableOpacity>}
      <ScrollView horizontal scrollEnabled={!dragging} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {Object.entries(columns).map(([status, title]) => <View key={status} ref={ref => { refs.current[status] = ref; }} collapsable={false}
          style={{ width: 270, minHeight: 400, backgroundColor: '#e8e6f1', borderRadius: 16, padding: 12, overflow: 'visible' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>{title} ({taskBoard[status]?.length || 0})</Text>
          <ScrollView scrollEnabled={!dragging} style={{ overflow: 'visible' }}>
            {!taskBoard[status]?.length && <Text>No tasks</Text>}
            {(taskBoard[status] || []).map(task => <DraggableCard key={task._id} task={task} onDrag={active => { setDragging(active); if (!active) setFloating(null); }} onDrop={drop}
              onMove={(item, x, y) => setFloating({ task: item, x: x - rootOffset.current.x, y: y - rootOffset.current.y })}
              enabled={!loading && (user.role === 'hr_manager' || idOf(task.assignedBy) === user._id || task.assignedTo.some(person => idOf(person) === user._id))}
              onOpen={() => navigation.navigate('TaskDetail', { taskId: task._id })} />)}
          </ScrollView>
        </View>)}
      </ScrollView>
    </>}
    {floating && <View pointerEvents="none" style={{ position: 'absolute', left: floating.x - 100, top: floating.y - 30,
      width: 200, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, elevation: 20, zIndex: 999 }}>
      <Text style={{ color: 'white', fontWeight: '600' }}>{floating.task.title}</Text>
    </View>}
  </SafeAreaView>;
}
