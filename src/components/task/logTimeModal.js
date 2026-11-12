import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../styles/color';

function FieldLabel({ children, clock }) {
  return <View style={styles.labelRow}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" accessible={false}>
      {clock && <Circle cx="12" cy="12" r="9" stroke={Colors.primary} strokeWidth="1.8" />}
      <Path d={clock ? 'M12 6v6l4 3' : 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6ZM14 3v6h6M8 12h8M8 16h5'}
        stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
    <Text style={styles.label}>{children}</Text>
  </View>;
}

export default function LogTimeModal({ visible, values, onChange, onSave, onClose, busy, locked }) {
  const minutesText = values.minutes || '';
  const note = values.note || '';
  const minutes = Number(minutesText);
  const validMinutes = minutesText.trim() !== '' && Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;
  const showMinutesError = minutesText.trim() !== '' && !validMinutes;
  const disabled = busy || locked;
  const saveDisabled = disabled || !validMinutes || note.length > 500;
  const close = () => { if (!busy) onClose(); };

  return <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={styles.centered}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.field}>
              <FieldLabel clock>Minutes</FieldLabel>
              <View style={[styles.minutesRow, showMinutesError && styles.invalidInput]}>
                <TextInput accessibilityLabel="Minutes" keyboardType="number-pad" editable={!disabled}
                  value={minutesText} onChangeText={text => onChange({ ...values, minutes: text })}
                  placeholder="e.g. 120" placeholderTextColor="#98A2B3" style={styles.minutesInput} />
                <View style={styles.unit}><Text style={styles.unitText}>min</Text></View>
              </View>
              {showMinutesError && <Text accessibilityLiveRegion="polite" style={styles.error}>Enter 1–1440 whole minutes.</Text>}
            </View>
            <View style={styles.field}>
              <FieldLabel>Note</FieldLabel>
              <TextInput accessibilityLabel="Note (optional, up to 500 characters)" multiline maxLength={500}
                editable={!disabled} value={note} onChangeText={text => onChange({ ...values, note: text })}
                placeholder="Add a note (optional)..." placeholderTextColor="#98A2B3" textAlignVertical="top" style={styles.noteInput} />
              <Text style={styles.counter}>{note.length}/500</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!busy }} disabled={busy}
                onPress={close} activeOpacity={0.7} style={[styles.button, styles.cancel, busy && styles.disabled]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!saveDisabled, busy: !!busy }}
                disabled={!!saveDisabled} onPress={onSave} activeOpacity={0.7} style={[styles.button, styles.save, saveDisabled && styles.disabled]}>
                {busy && <ActivityIndicator size="small" color={Colors.white} />}
                <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(16, 24, 40, 0.42)' },
  keyboard: { flex: 1 },
  centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 24, backgroundColor: Colors.frame, gap: 20 },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: Colors.black },
  minutesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.white },
  minutesInput: { flex: 1, minWidth: 0, minHeight: 50, fontSize: 18, color: Colors.black, paddingVertical: 12 },
  unit: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.frame },
  unitText: { fontSize: 13, color: Colors.primary },
  noteInput: { minHeight: 108, maxHeight: 180, borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 22, color: Colors.black, backgroundColor: Colors.white },
  counter: { fontSize: 12, lineHeight: 16, color: '#667085', textAlign: 'right', paddingRight: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, minHeight: 48, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancel: { backgroundColor: `${Colors.primary}14` },
  save: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  saveText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.5 },
  invalidInput: { borderColor: '#B42318' },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
});
