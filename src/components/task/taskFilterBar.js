import React, { useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import PrioritySelector from './prioritySelector';
import DateSelector from './dateSelector';
import CalendarModal from './calendarModal';
import { TagInput } from './advancedTaskFields';
import Colors from '../../styles/color';
export const dateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const sorts = { createdAt_desc: 'Newest first', createdAt_asc: 'Oldest first', dueDate_asc: 'Deadline ascending',
  dueDate_desc: 'Deadline descending', priority_desc: 'Priority high to low', priority_asc: 'Priority low to high', title_asc: 'Title A–Z' };
export default function TaskFilterBar({ filters, onChange, onReset }) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [draft, setDraft] = useState(filters);
  const apply = () => {
    if (!!draft.fromDate !== !!draft.toDate || (draft.fromDate && draft.fromDate > draft.toDate)) return Alert.alert('Date range', 'Select both dates, with From before To');
    onChange(draft); setOpen(false);
  };
  return <View style={{ padding: 12 }}>
    <TouchableOpacity onPress={() => { setDraft(filters); setOpen(true); }}>
      <Text style={{ color: Colors.primary }}>Filters · {filters.priority || 'All priorities'} · {sorts[filters.sort]}</Text>
    </TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Filter tasks</Text>
        <TouchableOpacity onPress={() => setPriority(true)}><Text>Priority: {draft.priority || 'All'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDraft({ ...draft, priority: null })}><Text>All priorities</Text></TouchableOpacity>
        <Text>Sort</Text>
        {Object.entries(sorts).map(([key, name]) => <TouchableOpacity key={key} onPress={() => setDraft({ ...draft, sort: key })}>
          <Text style={{ color: key === draft.sort ? Colors.primary : '#444' }}>{key === draft.sort ? '✓ ' : ''}{name}</Text>
        </TouchableOpacity>)}
        <TagInput tags={draft.tags} max={5} onChange={tags => setDraft({ ...draft, tags })} />
        <Text>Tasks must match every selected tag.</Text>
        <DateSelector label="Deadline from" value={draft.fromDate} onPress={() => setDateField('fromDate')} />
        <DateSelector label="Deadline to" value={draft.toDate} onPress={() => setDateField('toDate')} />
        <TouchableOpacity onPress={() => setDraft({ ...draft, fromDate: null, toDate: null })}><Text>Clear dates</Text></TouchableOpacity>
        <TouchableOpacity onPress={apply}><Text style={{ color: Colors.primary }}>Apply filters</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { onReset(); setOpen(false); }}><Text>Reset all</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setOpen(false)}><Text>Cancel</Text></TouchableOpacity>
      </ScrollView>
      {priority && <PrioritySelector visible onClose={() => setPriority(false)} selectedPriority={{ id: draft.priority }}
        onConfirm={item => { setDraft({ ...draft, priority: item?.id || null }); setPriority(false); }} />}
      {dateField && <CalendarModal visible onClose={() => setDateField(null)} onSelectDateValue={date => {
        setDraft({ ...draft, [dateField]: dateKey(date) }); setDateField(null);
      }} />}
    </Modal>
  </View>;
}
