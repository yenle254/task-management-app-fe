import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import AppButton from '../../components/appButton';
import Colors from '../../styles/color';
import useNotificationPreferencesStore from '../../../store/notificationPreferencesStore';
import { registerPushToken, permissionGranted } from '../../services/pushNotificationService';

export default function NotificationSettingsScreen({ navigation }) {
  const { preferences, isLoading, isSaving, error, fetchPreferences, updatePreferences } = useNotificationPreferencesStore();
  const [times, setTimes] = useState({ clockIn: '', clockOut: '' });
  const [message, setMessage] = useState('');
  useEffect(() => { fetchPreferences().catch(() => {}); }, [fetchPreferences]);
  useEffect(() => {
    if (preferences) setTimes({ clockIn: preferences.reminderTimes.clockIn || '', clockOut: preferences.reminderTimes.clockOut || '' });
  }, [preferences]);
  const save = patch => updatePreferences(patch).catch(() => {});
  const saveTimes = async () => {
    if (Object.values(times).some(value => value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) {
      setMessage('Enter a time as HH:mm, or leave blank for the office default.'); return;
    }
    try { await updatePreferences({ reminderTimes: { clockIn: times.clockIn || null, clockOut: times.clockOut || null } }); setMessage('Reminder times saved.'); }
    catch {}
  };
  const toggle = (label, value, onValueChange) => <View style={styles.row} key={label}>
    <Text style={styles.label}>{label}</Text><Switch accessibilityLabel={label} value={value} disabled={isSaving}
      onValueChange={onValueChange} trackColor={{ true: Colors.primary }} />
  </View>;
  return <SafeAreaView style={styles.screen}>
    <HeaderWithBackButton title="Notification settings" onBackPress={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content}>
      {isLoading && <ActivityIndicator accessibilityLabel="Loading notification settings" color={Colors.primary} />}
      {!!error && <View style={styles.card}><Text accessibilityRole="alert">{error}</Text>
        <AppButton text="Retry" style={styles.button} textStyle={styles.buttonText} onPress={() => fetchPreferences().catch(() => {})} /></View>}
      {preferences && <>
        <View style={styles.card}>
          {toggle('Enable notifications', preferences.master, value => save({ master: value }))}
          {toggle('Remote push', preferences.push, value => save({ push: value }))}
          {toggle('Sound', preferences.sound, value => save({ sound: value }))}
          <Text>Settings control delivery. Notifications remain available in your inbox.</Text>
        </View>
        {['task', 'leave', 'attendance'].map(category => <View key={category} style={styles.card}>
          <Text style={styles.title}>{category[0].toUpperCase() + category.slice(1)}</Text>
          {['inApp', 'push'].map(channel => toggle(category + (channel === 'inApp' ? ' in-app' : ' push'),
            preferences.categories[category][channel], value => save({ categories: { [category]: { [channel]: value } } })))}
        </View>)}
        <View style={styles.card}>
          <Text style={styles.title}>Task review notifications</Text>
          {Object.entries({ task_submitted_for_review: 'New submissions', task_review_reminder: 'Review reminders', task_review_approved: 'Approvals', task_review_requested: 'Changes requested', task_review_withdrawn: 'Withdrawals' }).map(([type, label]) => <View key={type}>
            <Text style={styles.title}>{label}</Text>
            {['inApp', 'push'].map(channel => toggle(label + (channel === 'inApp' ? ' in-app' : ' push'),
              preferences.categories.task.types?.[type]?.[channel] ?? preferences.categories.task[channel],
              value => save({ categories: { task: { types: { [type]: { [channel]: value } } } } })))}
          </View>)}
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Attendance reminders</Text>
          <Text>Server local time, Monday–Friday. Blank uses 30 minutes before office opening/closing.</Text>
          {['clockIn', 'clockOut'].map(key => <View key={key}>
            <Text style={styles.label}>{key === 'clockIn' ? 'Clock-in time (HH:mm)' : 'Clock-out time (HH:mm)'}</Text>
            <TextInput accessibilityLabel={key === 'clockIn' ? 'Clock-in reminder time' : 'Clock-out reminder time'}
              style={styles.input} value={times[key]} placeholder="HH:mm" maxLength={5} editable={!isSaving}
              onChangeText={value => setTimes(current => ({ ...current, [key]: value }))} />
          </View>)}
          <AppButton text={isSaving ? 'Saving…' : 'Save reminder times'} disabled={isSaving} onPress={saveTimes} style={styles.button} textStyle={styles.buttonText} />
        </View>
      </>}
      <AppButton text="Enable device notifications" style={styles.button} textStyle={styles.buttonText} onPress={async () => {
        const registered = await registerPushToken(true);
        setMessage(registered ? 'Push notifications registered.' : await permissionGranted() ? 'Local notifications enabled. Remote push requires a configured development build.' : 'Allow notifications in your device settings to enable alerts.');
      }} />
      {!!message && <Text accessibilityRole="alert">{message}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.secondary },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  card: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  label: { color: Colors.black, fontSize: 16, flexShrink: 1 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.black },
  input: { borderWidth: 1, borderColor: Colors.borderGray, borderRadius: 12, padding: 12, minHeight: 44, marginTop: 8 },
  button: { minHeight: 48, height: 'auto', width: '100%', padding: 12, borderRadius: 12 },
  buttonText: { fontSize: 15 }
});
