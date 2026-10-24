import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Colors from '../../../styles/color';
import { calendarDate, dateRange, dateString, presetRange } from '../../../utils/dashboardFilters';
import CalendarModal from '../../task/calendarModal';
import { Action, Empty, Note } from './dashboardUI';

export function SelectFilter({ label, value, options, onChange, disabled = false }) {
  if (!Array.isArray(options) || options.some((option) => !Array.isArray(option) || typeof option[0] !== 'string' || typeof option[1] !== 'string')) {
    return <Empty>{label}: filter options are not available.</Empty>;
  }
  return <View style={styles.select}>
    <Text style={styles.label}>{label}</Text>
    <Picker accessibilityLabel={label} selectedValue={value} enabled={!disabled} onValueChange={onChange} style={styles.picker}>
      {options.map(([id, name]) => <Picker.Item key={id} value={id} label={name} />)}
    </Picker>
  </View>;
}

export default function DashboardFilters({ filters, onChange, grouping = true, children }) {
  const [draft, setDraft] = useState({ startDate: filters.startDate, endDate: filters.endDate });
  const [error, setError] = useState('');
  const [calendarField, setCalendarField] = useState(null);
  useEffect(() => { setDraft({ startDate: filters.startDate, endDate: filters.endDate }); setError(''); }, [filters.startDate, filters.endDate]);
  const apply = () => {
    try {
      const dates = dateRange(draft);
      if (!dates.startDate) throw new Error('Enter both start and end dates.');
      setError(''); onChange({ ...filters, ...dates });
    } catch (err) { setError(err.message); }
  };
  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>Report filters</Text>
    <View style={styles.row}>{[['week', 'This week'], ['month', 'This month'], ['previous', 'Last month']].map(([id, name]) => (
      <Action key={id} onPress={() => onChange({ ...filters, ...presetRange(id) })}>{name}</Action>
    ))}</View>
    <View style={styles.row}>{[['startDate', 'Start date'], ['endDate', 'End date']].map(([key, label]) => (
      <View key={key} style={styles.date}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={`${label}, YYYY-MM-DD`} value={draft[key]} onChangeText={(value) => setDraft({ ...draft, [key]: value })}
          placeholder="YYYY-MM-DD" autoCapitalize="none" maxLength={10} style={styles.input} />
        <Action onPress={() => setCalendarField(key)}>Pick {label.toLowerCase()}</Action>
      </View>
    ))}<Action onPress={apply}>Apply dates</Action></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Note>Selected period: {filters.startDate} to {filters.endDate}, inclusive. Dates use the local server calendar.</Note>
    {grouping && <SelectFilter label="Trend grouping" value={filters.period} options={[["week", "Weekly"], ["month", "Monthly"]]} onChange={(period) => onChange({ ...filters, period })} />}
    {children}
    {calendarField && <CalendarModal visible onClose={() => setCalendarField(null)}
      contentStyle={styles.calendar}
      initialDate={calendarDate(draft[calendarField], filters[calendarField])}
      onSelectDateValue={(value) => {
        setDraft((current) => ({ ...current, [calendarField]: dateString(value) }));
        setCalendarField(null);
      }} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: Colors.white, borderRadius: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.black },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8 },
  date: { flexGrow: 1, flexBasis: 140 }, label: { fontSize: 13, color: Colors.black, marginBottom: 6 },
  input: { minHeight: 44, borderWidth: 1, borderColor: Colors.borderGray, borderRadius: 12, padding: 10, color: Colors.black },
  select: { flexGrow: 1, minWidth: 140 }, picker: { minHeight: 44, color: Colors.black, backgroundColor: Colors.secondary, borderRadius: 12 },
  error: { color: '#B42318', fontSize: 13 },
  calendar: { width: '100%', maxWidth: 480, alignSelf: 'center' },
});
