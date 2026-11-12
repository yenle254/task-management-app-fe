import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FormInput } from './taskFormFields';
import TaskTagsCard from './taskTagsCard';
import Colors from '../../styles/color';

export const emptyAdvancedFields = () => ({ tags: [], estimatedMinutes: '', storyPoints: '', checklistTitle: '' });
export const advancedPayload = fields => {
  const estimatedMinutes = fields.estimatedMinutes === '' ? null : Number(fields.estimatedMinutes);
  const storyPoints = fields.storyPoints === '' ? null : Number(fields.storyPoints);
  if (estimatedMinutes !== null && (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 0 || estimatedMinutes > 100000)) throw new Error('Estimate must be 0–100000 whole minutes');
  if (storyPoints !== null && (!Number.isFinite(storyPoints) || storyPoints < 0)) throw new Error('Story points must be a nonnegative number');
  return { tags: fields.tags, estimatedMinutes, storyPoints };
};
export const TagInput = ({ tags = [], onChange, max = 20, disabled = false }) => {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const atLimit = tags.length >= max;
  const add = () => {
    if (disabled) return;
    const value = draft.trim();
    if (!value || value.length > 50) return setError('Enter 1–50 characters.');
    if (!tags.includes(value) && atLimit) return setError(`Maximum ${max} tags. Remove a tag to add another.`);
    onChange([...new Set([...tags, value])]); setDraft(''); setError(''); setEditing(false);
  };
  return <TaskTagsCard tags={tags} disabled={disabled} style={styles.tagCard}
    onEdit={() => { setEditing(true); setError(''); }}
    onRemove={tag => { if (!disabled) { onChange(tags.filter(value => value !== tag)); setError(''); } }}>
    {editing && <View style={styles.editor}>
      <Text style={styles.inputLabel}>Tag name</Text>
      <TextInput accessibilityLabel="Tag name" value={draft} editable={!disabled} maxLength={50}
        autoFocus autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={add}
        onChangeText={text => { setDraft(text); setError(''); }} placeholder="Enter a tag" placeholderTextColor="#98A2B3"
        style={[styles.input, !!error && styles.inputError]} />
      <Text style={styles.hint}>{tags.length}/{max} tags · Up to 50 characters · Case-sensitive</Text>
      {!!(error || atLimit) && <Text accessibilityLiveRegion="polite" style={styles.error}>
        {error || `Maximum ${max} tags. Remove a tag to add another.`}
      </Text>}
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
          style={[styles.button, styles.cancel, disabled && styles.disabled]}
          onPress={() => { setEditing(false); setDraft(''); setError(''); }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: disabled || !draft.trim() || atLimit }}
          disabled={disabled || !draft.trim() || atLimit} onPress={add}
          style={[styles.button, styles.add, (disabled || !draft.trim() || atLimit) && styles.disabled]}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>}
  </TaskTagsCard>;
};
export default function AdvancedTaskFields({ value, onChange, creating = false }) {
  const change = (key, item) => onChange({ ...value, [key]: item });
  return <View style={{ marginVertical: 16 }}>
    <TagInput tags={value.tags} onChange={tags => change('tags', tags)} />
    <FormInput label="Estimated minutes (optional)" value={value.estimatedMinutes} onChangeText={text => change('estimatedMinutes', text)} />
    <FormInput label="Story points (optional)" value={value.storyPoints} onChangeText={text => change('storyPoints', text)} />
    {creating && <FormInput label="Initial checklist title (optional)" value={value.checklistTitle} onChangeText={text => change('checklistTitle', text)} />}
  </View>;
}

const styles = StyleSheet.create({
  tagCard: { marginHorizontal: 0, marginTop: 0, marginBottom: 16 },
  editor: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.frame, gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.black },
  input: { minHeight: 44, borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, color: Colors.black, fontSize: 14 },
  hint: { fontSize: 12, lineHeight: 18, color: '#667085' },
  inputError: { borderColor: '#B42318' },
  error: { fontSize: 12, lineHeight: 18, color: '#B42318' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  button: { flex: 1, minHeight: 44, padding: 12, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: `${Colors.primary}14` },
  add: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.5 },
});
