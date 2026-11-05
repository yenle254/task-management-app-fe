import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/authContext';
import useTaskStore from '../../../store/taskStore';
import AppButton from '../appButton';
import TaskReviewOwnership from './taskReviewOwnership';
import Colors from '../../styles/color';
const idOf = value => value?._id || value;
const date = value => value ? new Date(value).toLocaleString() : 'Unknown time';
const names = { submitted: 'Submitted', approved: 'Approved', changes_requested: 'Changes requested', withdrawn: 'Withdrawn', reassigned: 'Reassigned', cancelled: 'Cancelled' };
export default function TaskReviewPanel({ task, inbox = false }) {
  const { user } = useAuth();
  const store = useTaskStore();
  const [action, setAction] = useState(null), [text, setText] = useState(''), [message, setMessage] = useState('');
  const busy = useRef(false);
  const assignee = task.assignedTo?.some(person => idOf(person) === user?._id);
  const canDecide = !assignee && (inbox || task.reviewPermissions?.canDecide);
  const pending = task.status === 'in_review';
  const open = name => { setAction(name); setText(''); setMessage(''); };
  const run = async (name, value) => {
    if (busy.current || store.reviewBusy) return;
    busy.current = true; setMessage('');
    try { await store[name](task._id, value); setAction(null); setMessage('Review updated.'); }
    catch (error) {
      if (error?.status === 409) setAction(null);
      setMessage(error?.status === 409 ? 'This task was updated by someone else. Showing the latest state.' : error?.error || error.message || 'Could not update review. Try again.');
    } finally { busy.current = false; }
  };
  const button = (label, onPress, secondary = false, disabled = false) => <AppButton text={label} onPress={onPress}
    disabled={disabled || store.reviewBusy} style={[styles.button, secondary && styles.secondary]} textStyle={[styles.buttonText, secondary && { color: Colors.primary }]} />;
  const reason = action === 'requestChanges';
  return <View style={styles.panel}>
    <Text style={styles.heading}>{pending ? 'Awaiting approval' : 'Review'}</Text>
    {task.review?.submittedAt && <Text>Submitted by {task.review.submittedBy?.profile?.fullName || 'Assignee'} · {date(task.review.submittedAt)}</Text>}
    {!!task.review?.note && <Text>{task.review.note}</Text>}
    {assignee && task.status === 'in_progress' && button('Submit for review', () => open('submitForReview'))}
    {assignee && pending && button('Withdraw submission', () => open('withdrawSubmission'), true)}
    {canDecide && pending && <View style={styles.actions}>
      {button('Approve', () => open('approveTask'))}
      {button('Request changes', () => open('requestChanges'), true)}
    </View>}
    {!inbox && pending && user?.role === 'hr_manager' && <TaskReviewOwnership task={task} />}
    {!inbox && (task.review?.rounds || []).map((entry, index) => <View style={styles.event} key={index}>
      <Text style={{ fontWeight: '600' }}>Round {entry.round} · {names[entry.type] || entry.type}</Text>
      <Text>{entry.by?.profile?.fullName || 'User'} · {date(entry.at)}</Text>
      {!!entry.note && <Text>{entry.note}</Text>}{!!entry.reason && <Text>Reason: {entry.reason}</Text>}
    </View>)}
    {!!message && <Text accessibilityRole="alert">{message}</Text>}
    <Modal visible={!!action} transparent animationType="fade" onRequestClose={() => !store.reviewBusy && setAction(null)}>
      <View style={styles.overlay}><ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.modal} accessibilityViewIsModal>
          <Text style={styles.heading}>{reason ? 'Request changes' : action === 'approveTask' ? 'Approve task' : action === 'withdrawSubmission' ? 'Withdraw submission' : 'Submit for review'}</Text>
          {action !== 'withdrawSubmission' && <>
            <Text>{reason ? 'Reason (required, up to 1000 characters)' : 'Note (optional, up to 500 characters)'}</Text>
            <TextInput accessibilityLabel={reason ? 'Reason for changes' : 'Review note'} multiline value={text} onChangeText={setText}
              editable={!store.reviewBusy} style={styles.input} />
            {text.trim().length > (reason ? 1000 : 500) && <Text style={{ color: '#F95555' }}>Text is too long.</Text>}
          </>}
          {action === 'withdrawSubmission' && <Text>This returns the task to In Progress so you can edit and submit again.</Text>}
          {!!message && <Text accessibilityRole="alert">{message}</Text>}
          {button(store.reviewBusy ? 'Saving…' : 'Confirm', () => run(action, text.trim()), false,
            (reason && !text.trim()) || text.trim().length > (reason ? 1000 : 500))}
          {button('Cancel', () => setAction(null), true)}
        </View>
      </ScrollView></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.frame, borderRadius: 12, padding: 16, margin: 16, gap: 12 },
  heading: { fontSize: 18, fontWeight: '600', color: Colors.black },
  actions: { gap: 8 }, event: { borderTopWidth: 1, borderColor: Colors.borderGray, paddingTop: 12, gap: 4 },
  button: { width: '100%', height: 'auto', minHeight: 48, padding: 12, borderRadius: 12 },
  buttonText: { fontSize: 14 }, secondary: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary },
  overlay: { flex: 1, backgroundColor: '#0008' }, modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 520, alignSelf: 'center', borderRadius: 24, padding: 20, gap: 12, backgroundColor: Colors.white },
  input: { minHeight: 120, borderWidth: 1, borderColor: Colors.borderGray, borderRadius: 12, padding: 12, textAlignVertical: 'top', color: Colors.black }
});
