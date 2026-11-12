import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PrioritySelector from './prioritySelector';
import DateSelector from './dateSelector';
import CalendarModal from './calendarModal';
import { TagInput } from './advancedTaskFields';
import Colors from '../../styles/color';
export const dateKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const sorts = { createdAt_desc: 'Newest first', createdAt_asc: 'Oldest first', dueDate_asc: 'Deadline ascending',
  dueDate_desc: 'Deadline descending', priority_desc: 'Priority high to low', priority_asc: 'Priority low to high', title_asc: 'Title A–Z' };

function FilterBarIcon({ chevron = false }) {
  return <Svg width={chevron ? 14 : 22} height={chevron ? 14 : 22} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d={chevron ? 'M6 9l6 6 6-6' : 'M3 4h18l-7 8v7l-4 2V12L3 4Z'}
      stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export default function TaskFilterBar({ filters, onChange, onReset, style }) {
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [draft, setDraft] = useState(filters);
  const apply = () => {
    if (!!draft.fromDate !== !!draft.toDate || (draft.fromDate && draft.fromDate > draft.toDate)) return Alert.alert('Date range', 'Select both dates, with From before To');
    onChange(draft); setOpen(false);
  };
  const priorityLabel = filters.priority ? filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1) : 'All priorities';
  const sortLabel = sorts[filters.sort] || sorts.createdAt_desc;
  return <View style={[styles.container, style]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Filters, ${priorityLabel}, ${sortLabel}`}
      accessibilityHint="Open task filters" activeOpacity={0.7} style={styles.bar}
      onPress={() => { setDraft(filters); setOpen(true); }}>
      <View style={styles.filterHeading}>
        <FilterBarIcon />
        <Text style={styles.barText}>Filters</Text>
      </View>
      <View style={styles.filterOption}>
        <View style={styles.separator} />
        <Text style={styles.barText}>{priorityLabel}</Text>
        <FilterBarIcon chevron />
      </View>
      <View style={styles.filterOption}>
        <View style={styles.separator} />
        <Text style={styles.barText}>{sortLabel}</Text>
        <FilterBarIcon chevron />
      </View>
    </TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 16 }}>
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.frame },
  bar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 8, paddingVertical: 8 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterOption: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' },
  barText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: Colors.primary, flexShrink: 1 },
  separator: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.primary, marginHorizontal: 2 },
});
