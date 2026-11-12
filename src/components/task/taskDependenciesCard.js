import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../styles/color';
import { getTaskStatus } from '../../utils/taskStatusMap';
import { shortTaskCode } from './taskPickerModal';

const keyOf = value => value?._id || value;

function DependencyIcon({ name, color = Colors.primary, size = 22 }) {
  const paths = {
    link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-2 2M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l2-2',
    trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    plus: 'M12 5v14M5 12h14',
    todo: 'M8 12h8',
    in_progress: 'M12 7v5l3 2',
    in_review: 'M12 7v5M12 16h.01',
    done: 'M7 12l3 3 7-7',
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    {['todo', 'in_progress', 'in_review', 'done'].includes(name) && <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />}
    <Path d={paths[name]} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

function DependencyRow({ task, unavailable = false, disabled, onOpen, onRemove }) {
  const status = getTaskStatus(task.status);
  const body = <>
    <View style={styles.linkIcon}><DependencyIcon name="link" /></View>
    <View style={styles.rowContent}>
      <View style={styles.taskCopy}>
        <Text style={styles.taskTitle}>{unavailable ? 'Unavailable dependency' : task.title}</Text>
        <Text style={styles.taskCode}>{shortTaskCode(task._id)}</Text>
      </View>
      {!unavailable && <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
        <DependencyIcon name={task.status} color={status.color} size={14} />
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>}
    </View>
  </>;
  return <View style={styles.row}>
    {unavailable ? <View style={styles.openTask}>{body}</View> :
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open dependency: ${task.title}`}
        onPress={() => onOpen(task._id)} activeOpacity={0.7} style={styles.openTask}>{body}</TouchableOpacity>}
    <View style={styles.removeArea}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove dependency: ${unavailable ? shortTaskCode(task._id) : task.title}`}
        accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={() => onRemove(task._id)}
        activeOpacity={0.7} style={[styles.removeButton, disabled && styles.disabled]}>
        <DependencyIcon name="trash" size={20} />
      </TouchableOpacity>
    </View>
  </View>;
}

export default function TaskDependenciesCard({ dependencyIds = [], dependencies, loading, error, disabled, onRetry, onOpenTask, onRemove, onAdd }) {
  const tasks = dependencies.blockedBy || [];
  const unavailable = dependencyIds.filter(id => !tasks.some(task => task._id === keyOf(id)));
  const blocked = dependencies.blocking.length > 0 || unavailable.length > 0;
  return <View style={styles.section}>
    <Text style={styles.title}>Dependencies</Text>
    {!loading && !error && blocked && <Text style={styles.notice}>
      This task is blocked by unfinished or unavailable dependencies:
    </Text>}
    {!!loading && <ActivityIndicator color={Colors.primary} />}
    {!!error && <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.retry}>
      <Text style={styles.notice}>Could not load dependencies. Retry</Text>
    </TouchableOpacity>}
    {!loading && !error && !dependencyIds.length && !tasks.length && <Text style={styles.empty}>No dependencies yet</Text>}
    {tasks.map(task => <DependencyRow key={task._id} task={task} disabled={disabled}
      onOpen={onOpenTask} onRemove={onRemove} />)}
    {!loading && !error && unavailable.map(id => <DependencyRow key={keyOf(id)} task={{ _id: keyOf(id) }} unavailable
      disabled={disabled} onRemove={onRemove} />)}
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled}
      onPress={onAdd} activeOpacity={0.7} style={[styles.addButton, disabled && styles.disabled]}>
      <View style={styles.plusIcon}><DependencyIcon name="plus" color={Colors.white} size={20} /></View>
      <Text style={styles.addText}>Add dependency</Text>
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 10 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.black, marginBottom: 2 },
  notice: { fontSize: 14, lineHeight: 21, color: Colors.primary, marginBottom: 6 },
  empty: { fontSize: 13, lineHeight: 19, color: '#667085', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, backgroundColor: Colors.white, padding: 10, gap: 8 },
  openTask: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon: { width: 40, height: 44, borderRadius: 12, backgroundColor: `${Colors.primary}14`, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  taskCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 120, gap: 4 },
  taskTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: Colors.black },
  taskCode: { fontSize: 12, lineHeight: 17, color: Colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 24, maxWidth: '100%' },
  badgeText: { fontSize: 11, lineHeight: 16, fontWeight: '500', flexShrink: 1 },
  removeArea: { borderLeftWidth: 1, borderLeftColor: `${Colors.primary}20`, paddingLeft: 6 },
  removeButton: { width: 44, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frame },
  addButton: { marginTop: 4, minHeight: 56, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${Colors.primary}14` },
  plusIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: Colors.primary, flexShrink: 1 },
  retry: { minHeight: 44, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
});
