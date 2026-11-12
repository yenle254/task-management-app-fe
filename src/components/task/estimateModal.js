import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../styles/color';
import { advancedPayload } from './advancedTaskFields';

function EstimateIcon({ name, size = 20 }) {
  const paths = {
    hourglass: 'M7 3h10M7 21h10M8 3v4l8 10v4M16 3v4L8 17v4',
    star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
    clock: 'M12 7v5l3 2',
    hash: 'M10 4L8 20M16 4l-2 16M5 9h15M4 15h15',
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    {name === 'clock' && <Circle cx="12" cy="12" r="9" stroke={Colors.primary} strokeWidth="1.6" />}
    <Path d={paths[name]} stroke={Colors.primary} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

function EstimateField({ label, icon, suffix, value, onChangeText, placeholder, disabled, decimal }) {
  return <View style={styles.fieldRow}>
    <View style={styles.iconCircle}><EstimateIcon name={icon} /></View>
    <View style={styles.fieldBody}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput accessibilityLabel={label} value={value || ''} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor="#98A2B3" editable={!disabled}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'} style={styles.input} />
        <EstimateIcon name={suffix} size={16} />
      </View>
    </View>
  </View>;
}

export default function EstimateModal({ visible, values, onChange, onSave, onClose, busy, locked }) {
  let validationError = '';
  try { advancedPayload({ ...values, tags: [] }); }
  catch (error) { validationError = error.message; }
  const disabled = busy || locked;
  const close = () => { if (!busy) onClose(); };

  return <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={styles.centered}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.fields}>
              <EstimateField label="Estimated Minutes" icon="hourglass" suffix="clock" placeholder="e.g. 120"
                value={values.estimatedMinutes} onChangeText={text => onChange({ ...values, estimatedMinutes: text })} disabled={disabled} />
              <EstimateField label="Story Points" icon="star" suffix="hash" placeholder="e.g. 3" decimal
                value={values.storyPoints} onChangeText={text => onChange({ ...values, storyPoints: text })} disabled={disabled} />
              {!!validationError && <Text accessibilityLiveRegion="polite" style={styles.error}>{validationError}</Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!busy }} disabled={busy}
                onPress={close} activeOpacity={0.7} style={[styles.button, styles.cancel, busy && styles.disabled]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || validationError), busy: !!busy }}
                disabled={!!(disabled || validationError)} onPress={onSave} activeOpacity={0.7}
                style={[styles.button, styles.save, (disabled || !!validationError) && styles.disabled]}>
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
  dialog: { width: '100%', maxWidth: 400, padding: 8, borderRadius: 24, backgroundColor: Colors.frame },
  fields: { padding: 16, borderRadius: 24, backgroundColor: Colors.frame, gap: 24 },
  fieldRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.frame },
  fieldBody: { flex: 1, minWidth: 0, gap: 8 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: Colors.black, paddingTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.white },
  input: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10, fontSize: 14, color: Colors.black },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 16, paddingBottom: 4 },
  button: { flex: 1, minHeight: 44, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancel: { backgroundColor: `${Colors.primary}14` },
  save: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  saveText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.5 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
});
