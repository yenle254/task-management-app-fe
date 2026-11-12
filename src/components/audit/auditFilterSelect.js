import React, { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectInputField from '../profile/selectInputField';
import Colors from '../../styles/color';

export default function AuditFilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(value);
  const insets = useSafeAreaInsets();
  const selectedLabel = options.find(option => option.value === value)?.label || 'All';
  const canConfirm = options.some(option => option.value === pending);

  const show = () => {
    Keyboard.dismiss();
    setPending(value);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const confirm = () => {
    if (!canConfirm) return;
    onChange(pending);
    close();
  };

  return (
    <>
      <SelectInputField
        label={label}
        value={selectedLabel}
        onPress={show}
        accessibilityLabel={`${label}: ${selectedLabel}`}
        accessibilityState={{ expanded: open }}
      />
      {open && (
        <Modal visible transparent animationType="slide" onRequestClose={close}>
          <View style={styles.overlay}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              accessibilityRole="button"
              accessibilityLabel={`Close ${label} selection`}
              onPress={close}
            />
            <View accessibilityViewIsModal style={styles.sheet}>
              <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Select {label}</Text>
                <View style={styles.divider} />
              </View>
              <ScrollView style={styles.options} keyboardShouldPersistTaps="handled">
                {options.map(option => {
                  const selected = option.value === pending;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityLabel={option.label}
                      accessibilityState={{ checked: selected }}
                      aria-checked={selected}
                      onPress={() => setPending(option.value)}
                      style={[styles.option, selected && styles.selectedOption]}
                    >
                      <Text style={[styles.optionText, selected && styles.selectedText]}>{option.label}</Text>
                      {selected && <View style={styles.indicator} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Pressable accessibilityRole="button" onPress={close} style={[styles.button, styles.closeButton]}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={confirm} disabled={!canConfirm}
                  accessibilityState={{ disabled: !canConfirm }}
                  style={[styles.button, styles.confirmButton, !canConfirm && styles.disabledButton]}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '80%', alignSelf: 'center', backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginTop: 16 },
  options: { maxHeight: 400, flexShrink: 1 },
  option: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedOption: { backgroundColor: '#F4F3FF' },
  optionText: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.black },
  selectedText: { color: Colors.primary, fontWeight: '600' },
  indicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary },
  buttons: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 16, flexShrink: 0 },
  button: { flex: 1, minHeight: 48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  closeButton: { backgroundColor: '#F5F5F5' },
  confirmButton: { backgroundColor: Colors.primary },
  disabledButton: { backgroundColor: '#CCCCCC' },
  closeText: { fontSize: 16, fontWeight: '600', color: '#666666' },
  confirmText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
