import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppButton from '../appButton';
import Colors from '../../styles/color';
import useLeaveStore from '../../../store/leaveStore';

export const leaveStatusLabel = status => ({
  draft: 'Draft', pending: 'Pending approval', pending_team_lead: 'Waiting for Team Lead',
  pending_hr: 'Waiting for HR', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled'
}[status] || status);

export default function LeaveWorkflowDetails({ leave, user, navigation, onChanged, onClose }) {
  const { cancelLeave, isMutating } = useLeaveStore();
  const [error, setError] = useState('');
  const owner = String(leave.userId?._id || leave.userId) === String(user?._id || user?.id);
  const pending = ['pending', 'pending_team_lead', 'pending_hr'].includes(leave.status);
  const cancellable = (owner || user?.role === 'hr_manager') &&
    (pending || (owner && leave.status === 'draft') || (leave.status === 'approved' && new Date(leave.startDate) > new Date()));
  const cancel = async () => {
    if (isMutating) return;
    try { setError(''); await cancelLeave(leave._id, leave.revision); onChanged?.(); onClose?.(); }
    catch (e) { setError(e?.error || 'Request changed. Refresh and retry.'); onChanged?.(); }
  };
  return <View style={styles.section}>
    <Text style={styles.status}>{leaveStatusLabel(leave.status)}</Text>
    {leave.operation && <Text>An operation is being processed. Refresh before trying again.</Text>}
    <Text style={styles.heading}>History</Text>
    {(leave.history || []).length === 0 && <Text>No recorded workflow history.</Text>}
    {(leave.history || []).map((entry, index) => <View key={index} style={styles.event}>
      <Text>{entry.action.replace(/_/g, ' ')} · {leaveStatusLabel(entry.to)}</Text>
      <Text>{entry.by?.profile?.fullName || entry.by?.email || 'Recorded actor'} · {new Date(entry.at).toLocaleString()}</Text>
      {entry.reason ? <Text>{entry.reason}</Text> : null}
    </View>)}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {owner && ['draft', 'pending_team_lead'].includes(leave.status) && <AppButton
      text={leave.status === 'draft' ? 'Edit and submit draft' : 'Edit and resubmit'}
      disabled={isMutating || !!leave.operation} style={styles.button} textStyle={{ fontSize: 15 }}
      onPress={() => { onClose?.(); navigation.navigate('SubmitLeave', { leave }); }} />}
    {cancellable && <AppButton text="Cancel leave" disabled={isMutating || !!leave.operation} onPress={cancel} style={styles.button} textStyle={{ fontSize: 15 }} />}
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 12, paddingVertical: 12 }, status: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
  heading: { fontWeight: '600', fontSize: 16 }, event: { gap: 4, paddingVertical: 8 },
  button: { width: '100%', minHeight: 44, borderRadius: 12 }
});
