import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../styles/color';

export default function ChecklistEntryModal({ visible, item = false, value = '', onChangeText, onAdd, onClose, busy, locked }) {
  const maxLength = item ? 500 : 255;
  const title = value.trim();
  const disabled = busy || locked;
  const invalid = !title || title.length > maxLength;
  const close = () => { if (!busy) onClose(); };
  const add = () => { if (!disabled && !invalid) onAdd(title); };

  return <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={close}>
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={styles.centered}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.field}>
              <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                accessibilityLabel={`${item ? 'Checklist item' : 'Checklist'} title (required)`}
                value={value}
                onChangeText={onChangeText}
                editable={!disabled}
                maxLength={maxLength}
                placeholder={item ? 'e.g. Review design' : 'e.g. Design review'}
                placeholderTextColor="#98A2B3"
                returnKeyType="done"
                onSubmitEditing={add}
                style={styles.input}
              />
              {!!value.length && invalid && <Text accessibilityLiveRegion="polite" style={styles.error}>
                {title ? `Use up to ${maxLength} characters.` : 'Title is required.'}
              </Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!busy }} disabled={busy}
                onPress={close} activeOpacity={0.7} style={[styles.button, styles.cancel, busy && styles.disabled]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || invalid), busy: !!busy }}
                disabled={!!(disabled || invalid)} onPress={add} activeOpacity={0.7}
                style={[styles.button, styles.add, (disabled || invalid) && styles.disabled]}>
                {busy && <ActivityIndicator size="small" color={Colors.white} />}
                <Text style={styles.addText}>{busy ? 'Adding...' : 'Add'}</Text>
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
  dialog: { width: '100%', maxWidth: 400, padding: 20, borderRadius: 24, backgroundColor: Colors.frame },
  field: { gap: 8 },
  label: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: Colors.black },
  required: { color: '#B42318' },
  input: { minHeight: 48, borderWidth: 1, borderColor: `${Colors.primary}20`, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.black, backgroundColor: Colors.white },
  actions: { flexDirection: 'row', gap: 8, marginTop: 24 },
  button: { flex: 1, minHeight: 44, borderRadius: 24, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancel: { backgroundColor: `${Colors.primary}14` },
  add: { backgroundColor: Colors.primary },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.5 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
});
