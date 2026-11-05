import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BuildingIcon from '../../../../assets/icons/company.svg';
import TaskIcon from '../../../../assets/icons/task-square.svg';
import PriorityIcon from '../../../../assets/icons/priority.svg';
import UserIcon from '../../../../assets/icons/user.svg';
import ChevronDown from '../../../../assets/icons/chevron_down.svg';
import Colors from '../../../styles/color';
import { calendarDate, dateRange, dateString, presetRange } from '../../../utils/dashboardFilters';
import CalendarModal from '../../task/calendarModal';
import { Action, Empty, Note } from './dashboardUI';

export function SelectFilter({ label, value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(value);
  const insets = useSafeAreaInsets();
  if (!Array.isArray(options) || options.some((option) => !Array.isArray(option) || typeof option[0] !== 'string' || typeof option[1] !== 'string')) {
    return <Empty>{label}: filter options are not available.</Empty>;
  }
  const selectedLabel = options.find(([id]) => id === value)?.[1] || 'Select an option';
  const Icon = label === 'Task priority' ? PriorityIcon : label === 'Employee' ? UserIcon : label === 'Team' ? BuildingIcon : TaskIcon;
  const canConfirm = !disabled && options.some(([id]) => id === pending);
  const close = () => setOpen(false);
  return <View style={styles.select}>
    <Text style={styles.selectLabel}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selectedLabel}`}
      accessibilityState={{ disabled, expanded: open }} disabled={disabled}
      style={[styles.selector, disabled && styles.disabled]}
      onPress={() => { setPending(value); setOpen(true); }}>
      <Icon width={20} height={20} />
      <Text style={styles.selectorText} numberOfLines={1}>{selectedLabel}</Text>
      <ChevronDown width={20} height={20} />
    </Pressable>
    {open && !disabled && <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} accessibilityRole="button" accessibilityLabel={`Close ${label} selection`} onPress={close} />
        <View accessibilityViewIsModal style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>Select {label}</Text>
          </View>
          <ScrollView style={styles.options}>
            {options.map(([id, name]) => <Pressable key={id} accessibilityRole="radio" accessibilityLabel={name}
              accessibilityState={{ checked: pending === id }} aria-checked={pending === id} onPress={() => setPending(id)}
              style={[styles.option, pending === id && styles.selectedOption]}>
              <Text style={[styles.optionText, pending === id && styles.selectedOptionText]}>{name}</Text>
            </Pressable>)}
          </ScrollView>
          <View style={styles.modalButtons}>
            <Action style={[styles.modalButton, styles.closeButton]} textStyle={styles.closeButtonText} onPress={close}>Close</Action>
            <Action style={[styles.modalButton, styles.confirmButton]} textStyle={styles.confirmButtonText} disabled={!canConfirm}
              onPress={() => { if (canConfirm) { onChange(pending); close(); } }}>Confirm</Action>
          </View>
        </View>
      </View>
    </Modal>}
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
        <Action style={[styles.dateButton, key === 'startDate' ? styles.startButton : styles.endButton]}
          textStyle={styles.dateButtonText} onPress={() => setCalendarField(key)}>Pick {label.toLowerCase()}</Action>
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
  dateButton: { marginTop: 10, alignSelf: 'stretch', alignItems: 'center' },
  startButton: { backgroundColor: '#66B58F' },
  endButton: { backgroundColor: '#E98484' },
  dateButtonText: { color: '#FFFFFF' },
  select: { minWidth: 140, gap: 8 },
  selectLabel: { fontSize: 16, fontWeight: '600', color: Colors.black },
  selector: { minHeight: 52, padding: 16, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectorText: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '500', color: Colors.black },
  disabled: { opacity: 0.45 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', maxWidth: 480, maxHeight: '75%', alignSelf: 'center', padding: 20, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { paddingBottom: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  options: { maxHeight: 300, flexShrink: 1, minHeight: 0 },
  option: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'center', borderRadius: 10 },
  selectedOption: { backgroundColor: '#EEEBFF' },
  optionText: { fontSize: 15, color: Colors.black },
  selectedOptionText: { color: Colors.primary, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16, flexShrink: 0 },
  modalButton: { flex: 1, minHeight: 48, alignItems: 'center', alignSelf: 'stretch' },
  closeButton: { backgroundColor: '#F5F5F5' },
  closeButtonText: { color: '#666666' },
  confirmButton: { backgroundColor: Colors.primary },
  confirmButtonText: { color: '#FFFFFF' },
  error: { color: '#B42318', fontSize: 13 },
  calendar: { width: '100%', maxWidth: 480, alignSelf: 'center' },
});
