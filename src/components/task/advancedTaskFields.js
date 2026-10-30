import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { FormInput } from './taskFormFields';
import TaskCategory from '../taskCategory';
import AppButton from '../appButton';

export const emptyAdvancedFields = () => ({ tags: [], estimatedMinutes: '', storyPoints: '', checklistTitle: '' });
export const advancedPayload = fields => {
  const estimatedMinutes = fields.estimatedMinutes === '' ? null : Number(fields.estimatedMinutes);
  const storyPoints = fields.storyPoints === '' ? null : Number(fields.storyPoints);
  if (estimatedMinutes !== null && (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 0 || estimatedMinutes > 100000)) throw new Error('Estimate must be 0–100000 whole minutes');
  if (storyPoints !== null && (!Number.isFinite(storyPoints) || storyPoints < 0)) throw new Error('Story points must be a nonnegative number');
  return { tags: fields.tags, estimatedMinutes, storyPoints };
};
export const TagInput = ({ tags = [], onChange, max = 20 }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (!value || value.length > 50) return Alert.alert('Tag', 'Enter 1–50 characters');
    if (!tags.includes(value) && tags.length >= max) return Alert.alert('Tag', 'Maximum ' + max + ' tags');
    onChange([...new Set([...tags, value])]); setDraft('');
  };
  return <View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{tags.map(tag =>
      <TouchableOpacity accessibilityLabel={'Remove tag ' + tag} key={tag} onPress={() => onChange(tags.filter(value => value !== tag))}>
        <TaskCategory name={tag} />
      </TouchableOpacity>)}</View>
    <FormInput label={'Tags (up to ' + max + ')'} value={draft} onChangeText={setDraft} placeholder="Enter a tag" />
    <AppButton text="Add tag" onPress={add} style={{ width: 110, height: 36, marginBottom: 12 }} />
    <Text>Tap a tag to remove it. Tags are case-sensitive.</Text>
  </View>;
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
