import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BuildingIcon from '../../../../assets/icons/company.svg';
import CalendarIcon from '../../../../assets/icons/calendar-2.svg';
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

  const isPresetActive = (id) => {
    const preset = presetRange(id);
    return filters.startDate === preset.startDate && filters.endDate === preset.endDate;
  };

  return <View style={styles.container}>
    <View style={styles.headerRow}>
      <Text accessibilityRole="header" style={styles.title}>Report filters</Text>
      <View style={styles.periodPill}>
        <CalendarIcon width={13} height={13} />
        <Text style={styles.periodPillText}>{filters.startDate} → {filters.endDate}</Text>
      </View>
    </View>

    <View style={styles.segmentedTrack}>
      {[['week', 'This week'], ['month', 'This month'], ['previous', 'Last month']].map(([id, name]) => {
        const active = isPresetActive(id);
        return (
          <Action
            key={id}
            style={[styles.presetBtn, active && styles.presetBtnActive]}
            textStyle={[styles.presetBtnText, active && styles.presetBtnTextActive]}
            onPress={() => onChange({ ...filters, ...presetRange(id) })}
          >
            {name}
          </Action>
        );
      })}
    </View>

    <View style={styles.dateBox}>
      <View style={styles.dateRow}>
        {[['startDate', 'Start date'], ['endDate', 'End date']].map(([key, label]) => (
          <View key={key} style={styles.dateField}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              accessibilityLabel={`${label}, YYYY-MM-DD`}
              value={draft[key]}
              onChangeText={(value) => setDraft({ ...draft, [key]: value })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#98A2B3"
              autoCapitalize="none"
              maxLength={10}
              style={styles.input}
            />
            <Action
              style={styles.dateButton}
              textStyle={styles.dateButtonText}
              onPress={() => setCalendarField(key)}
            >
              {`Pick ${label.toLowerCase()}`}
            </Action>
          </View>
        ))}
      </View>
      <Action style={styles.applyButton} textStyle={styles.applyButtonText} onPress={apply}>Apply dates</Action>
    </View>

    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

    <View style={styles.infoBanner}>
      <Note>Selected period: {filters.startDate} to {filters.endDate}, inclusive. Dates use the local server calendar.</Note>
    </View>

    {(grouping || children) && (
      <View style={styles.extraFiltersWrap}>
        {grouping && <SelectFilter label="Trend grouping" value={filters.period} options={[["week", "Weekly"], ["month", "Monthly"]]} onChange={(period) => onChange({ ...filters, period })} />}
        {children}
      </View>
    )}

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
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#101828', letterSpacing: -0.2 },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F3FF',
    borderWidth: 1,
    borderColor: '#E9D7FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.button,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  presetBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475467',
  },
  presetBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dateBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateField: {
    flexGrow: 1,
    flexBasis: 135,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#344054' },
  input: {
    minHeight: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
  },
  dateButton: {
    minHeight: 36,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  dateButtonText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
  },
  applyButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  extraFiltersWrap: {
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  select: { minWidth: 140, gap: 8 },
  selectLabel: { fontSize: 16, fontWeight: '600', color: '#000000' },
  selector: {
    minHeight: 52,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorText: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '500', color: '#000000' },
  disabled: { opacity: 0.45 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', maxWidth: 480, maxHeight: '75%', alignSelf: 'center', padding: 20, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { paddingBottom: 12, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000000', textAlign: 'center' },
  options: { maxHeight: 300, flexShrink: 1, minHeight: 0 },
  option: { minHeight: 48, paddingVertical: 16, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8 },
  selectedOption: { backgroundColor: Colors.primary + '15' },
  optionText: { fontSize: 16, color: '#333333' },
  selectedOptionText: { color: Colors.primary, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16, flexShrink: 0 },
  modalButton: { flex: 1, minHeight: 48, paddingVertical: 14, borderRadius: 12, borderWidth: 0, alignItems: 'center', alignSelf: 'stretch' },
  closeButton: { backgroundColor: '#F5F5F5', borderWidth: 0 },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#666666' },
  confirmButton: { backgroundColor: Colors.primary, borderWidth: 0 },
  confirmButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  error: { color: '#B42318', fontSize: 13, fontWeight: '500', backgroundColor: '#FEF3F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FEE4E2' },
  calendar: { width: '100%', maxWidth: 480, alignSelf: 'center' },
});
