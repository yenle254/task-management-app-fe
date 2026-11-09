import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../styles/color';
import { getTaskStatus } from '../../utils/taskStatusMap';
import taskService from '../../services/taskService';

const paths = {
  link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-2 2M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l2-2',
  tag: 'M20 13l-7 7a2 2 0 01-3 0l-7-7V4h9l8 6a2 2 0 010 3Z',
  crown: 'M3 7l5 4 4-7 4 7 5-4-3 12H6L3 7ZM7 22h10',
  branch: 'M7 4v16M7 8h10M7 16h10M15 6l2 2-2 2M15 14l2 2-2 2',
  arrow: 'M9 5l7 7-7 7',
  open: 'M14 3h7v7M21 3L10 14M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5',
  minus: 'M8 12h8',
  plus: 'M12 5v14M5 12h14',
};

function Icon({ name, size = 20 }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    {name === 'minus' && <Circle cx="12" cy="12" r="9" stroke={Colors.primary} strokeWidth="1.8" />}
    <Path d={paths[name]} stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {name === 'tag' && <Circle cx="8" cy="8" r="1.3" fill={Colors.primary} />}
  </Svg>;
}

function CardHeader({ icon, title, subtitle }) {
  return <View style={styles.header}>
    <View style={styles.headerIcon}><Icon name={icon} /></View>
    <View style={styles.headerCopy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  </View>;
}

function LinkButton({ icon, children, onPress, disabled, style, expanded }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled, ...(expanded === undefined ? {} : { expanded }) }}
    disabled={disabled} onPress={onPress} activeOpacity={0.7} style={[styles.linkButton, style, disabled && styles.disabled]}>
    {icon && <Icon name={icon} size={16} />}
    <Text style={styles.linkText}>{children}</Text>
  </TouchableOpacity>;
}

function TaskRow({ task, parent = false, onPress }) {
  const status = task.status ? getTaskStatus(task.status) : null;
  const badge = status && <View style={[styles.status, { backgroundColor: status.bgColor }]}>
    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
  </View>;
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${parent ? 'parent' : 'child'} task: ${task.title}`}
    onPress={onPress} activeOpacity={0.7} style={[styles.taskRow, parent && styles.parentRow]}>
    <View style={styles.taskIcon}><Icon name={parent ? 'crown' : 'branch'} /></View>
    <View style={[styles.taskCopy, !parent && styles.childCopy]}>
      <Text style={[styles.taskTitle, !parent && styles.childTitle]}>{task.title}</Text>
      {badge}
    </View>
    <Icon name="arrow" size={16} />
  </TouchableOpacity>;
}

export function TaskHierarchyCard({ task, childTasks, loading, error, onRetry, disabled, onSetParent, onRemoveParent, onOpenTask }) {
  const parentId = task.parentTaskId?._id || task.parentTaskId;
  const [parentState, setParentState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  // The detail API may return just the parent ID. Fetch its real title/status
  // without replacing the currently selected task in the store.
  useEffect(() => {
    let active = true;
    if (!parentId) return;
    setParentState({ id: parentId, loading: true });
    taskService.getTaskById(parentId).then(response => {
      if (active) setParentState({ id: parentId, task: response.data });
    }).catch(() => {
      if (active) setParentState({ id: parentId, error: true });
    });
    return () => { active = false; };
  }, [parentId, task.updatedAt, retry]);
  useEffect(() => { setExpanded(false); }, [task._id]);
  const currentParent = parentState?.id === parentId ? parentState : null;
  const parentTask = currentParent?.task || (task.parentTaskId?.title ? task.parentTaskId : null);
  const visibleChildren = expanded ? childTasks : childTasks.slice(0, 2);

  return <View style={styles.card}>
    <CardHeader icon="link" title="Parent and child tasks" subtitle="Manage task hierarchy" />
    <Text style={styles.label}>Parent task</Text>
    {parentId ? <>
      {parentTask ? <TaskRow task={parentTask} parent onPress={() => onOpenTask(parentId)} />
        : <View style={styles.parentPlaceholder}>
          {currentParent?.error ? <>
            <Text style={styles.emptyText}>Parent details unavailable</Text>
            <LinkButton onPress={() => setRetry(value => value + 1)}>Retry</LinkButton>
          </> : <><ActivityIndicator color={Colors.primary} /><Text style={styles.emptyText}>Loading parent task…</Text></>}
        </View>}
      <View style={styles.parentActions}>
        <LinkButton icon="open" onPress={() => onOpenTask(parentId)} style={styles.parentAction}>Open parent task</LinkButton>
        <View style={styles.actionDivider} />
        <LinkButton icon="minus" onPress={onRemoveParent} disabled={disabled} style={styles.parentAction}>Remove parent</LinkButton>
      </View>
    </> : <View style={styles.emptyParent}>
      <Text style={styles.emptyText}>No parent task</Text>
      <LinkButton icon="plus" disabled={disabled} onPress={onSetParent}>Set parent</LinkButton>
    </View>}
    <View style={styles.childrenSection}>
      <View style={styles.childrenHeader}>
        <Text style={styles.label}>Child tasks{!loading && !error ? ` (${childTasks.length})` : ''}</Text>
        {childTasks.length > 2 && <LinkButton onPress={() => setExpanded(value => !value)} expanded={expanded}>
          {expanded ? 'Show less' : `View all (${childTasks.length})`}
        </LinkButton>}
      </View>
      {loading && !childTasks.length ? <ActivityIndicator color={Colors.primary} style={styles.loading} />
        : error ? <LinkButton onPress={onRetry}>Could not load child tasks · Retry</LinkButton>
          : !childTasks.length ? <Text style={styles.emptyText}>No child tasks</Text> : null}
      <View style={styles.childList}>
        {visibleChildren.map(child => <TaskRow key={child._id} task={child} onPress={() => onOpenTask(child._id)} />)}
      </View>
    </View>
  </View>;
}

// Decorative tag colors reuse the existing brand and task-status palette.
const tagColors = [
  { backgroundColor: Colors.frame, color: Colors.primary },
  { backgroundColor: getTaskStatus('in_progress').bgColor, color: getTaskStatus('in_progress').color },
  { backgroundColor: getTaskStatus('done').bgColor, color: getTaskStatus('done').color },
];

export function TaskTagsCard({ tags, disabled, onEdit }) {
  return <View style={styles.card}>
    <CardHeader icon="tag" title="Tags" subtitle="Categorize your task" />
    {!tags.length && <Text style={styles.emptyText}>No tags yet</Text>}
    <View style={styles.tags}>
      {tags.map((tag, index) => {
        const palette = tagColors[index % tagColors.length];
        return <TouchableOpacity key={tag} accessibilityRole="button" accessibilityLabel={`Edit tag ${tag}`}
          accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onEdit} activeOpacity={0.7}
          style={[styles.tagTarget, disabled && styles.disabled]}>
          <View style={[styles.tagPill, { backgroundColor: palette.backgroundColor }]}>
            <Text style={[styles.tagText, { color: palette.color }]}>{tag}</Text>
          </View>
        </TouchableOpacity>;
      })}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled}
        onPress={onEdit} activeOpacity={0.7} style={[styles.tagTarget, disabled && styles.disabled]}>
        <View style={[styles.tagPill, styles.addTag]}><Icon name="plus" size={14} /><Text style={styles.tagText}>Add tag</Text></View>
      </TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.frame },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.frame, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.black },
  subtitle: { fontSize: 12, lineHeight: 17, color: '#667085' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.black, flexShrink: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, backgroundColor: Colors.frame, padding: 12, minHeight: 56 },
  parentRow: { marginTop: 8 },
  taskIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  taskCopy: { flex: 1, minWidth: 0, gap: 4 },
  childCopy: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  taskTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: Colors.black },
  childTitle: { flexGrow: 1, flexShrink: 1, flexBasis: 100, fontSize: 13, fontWeight: '500' },
  status: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 3, maxWidth: '100%' },
  statusText: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  parentPlaceholder: { minHeight: 68, backgroundColor: Colors.frame, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  parentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  parentAction: { flex: 1, paddingHorizontal: 4 },
  actionDivider: { width: 1, height: 24, backgroundColor: Colors.secondary },
  linkButton: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  linkText: { fontSize: 12, lineHeight: 17, color: Colors.primary, flexShrink: 1 },
  emptyParent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  emptyText: { fontSize: 13, lineHeight: 19, color: '#667085', flexShrink: 1 },
  childrenSection: { borderTopWidth: 1, borderTopColor: Colors.secondary, marginTop: 8, paddingTop: 8 },
  childrenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 8 },
  childList: { gap: 8 },
  loading: { paddingVertical: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 },
  tagTarget: { minHeight: 44, maxWidth: '100%', justifyContent: 'center' },
  tagPill: { borderRadius: 24, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12, lineHeight: 17, fontWeight: '500', color: Colors.primary, flexShrink: 1 },
  addTag: { borderWidth: 1, borderColor: Colors.primary },
  disabled: { opacity: 0.5 },
});
