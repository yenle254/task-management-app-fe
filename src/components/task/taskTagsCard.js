import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../styles/color';
import { getTaskStatus } from '../../utils/taskStatusMap';

function TagIcon({ name = 'tag', size = 20, color = Colors.primary }) {
  const paths = {
    tag: 'M20 13l-7 7a2 2 0 01-3 0l-7-7V4h9l8 6a2 2 0 010 3Z',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 6l12 12M6 18L18 6',
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d={paths[name]} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {name === 'tag' && <Circle cx="8" cy="8" r="1.3" fill={color} />}
  </Svg>;
}

// Decorative tag colors reuse the existing brand and task-status palette.
const tagColors = [
  { backgroundColor: Colors.frame, color: Colors.primary },
  { backgroundColor: getTaskStatus('in_progress').bgColor, color: getTaskStatus('in_progress').color },
  { backgroundColor: getTaskStatus('done').bgColor, color: getTaskStatus('done').color },
];

export default function TaskTagsCard({ tags = [], disabled, onEdit, onRemove, style, children }) {
  return <View style={[styles.card, style]}>
    <View style={styles.header}>
      <View style={styles.headerIcon}><TagIcon /></View>
      <View style={styles.headerCopy}>
        <Text style={styles.title}>Tags</Text>
        <Text style={styles.subtitle}>Categorize your task</Text>
      </View>
    </View>
    {!tags.length && <Text style={styles.emptyText}>No tags yet</Text>}
    <View style={styles.tags}>
      {tags.map((tag, index) => {
        const palette = tagColors[index % tagColors.length];
        return <TouchableOpacity key={tag} accessibilityRole="button" accessibilityLabel={`${onRemove ? 'Remove' : 'Edit'} tag ${tag}`}
          accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={() => onRemove ? onRemove(tag) : onEdit()} activeOpacity={0.7}
          style={[styles.tagTarget, disabled && styles.disabled]}>
          <View style={[styles.tagPill, { backgroundColor: palette.backgroundColor }]}>
            <Text style={[styles.tagText, { color: palette.color }]}>{tag}</Text>
            {!!onRemove && <TagIcon name="close" size={12} color={palette.color} />}
          </View>
        </TouchableOpacity>;
      })}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled}
        onPress={onEdit} activeOpacity={0.7} style={[styles.tagTarget, disabled && styles.disabled]}>
        <View style={[styles.tagPill, styles.addTag]}><TagIcon name="plus" size={14} /><Text style={styles.tagText}>Add tag</Text></View>
      </TouchableOpacity>
    </View>
    {children}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.frame },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.frame, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.black },
  subtitle: { fontSize: 12, lineHeight: 17, color: '#667085' },
  emptyText: { fontSize: 13, lineHeight: 19, color: '#667085', flexShrink: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 },
  tagTarget: { minHeight: 44, maxWidth: '100%', justifyContent: 'center' },
  tagPill: { borderRadius: 24, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12, lineHeight: 17, fontWeight: '500', color: Colors.primary, flexShrink: 1 },
  addTag: { borderWidth: 1, borderColor: Colors.primary },
  disabled: { opacity: 0.5 },
});
