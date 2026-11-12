import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import AppButton from '../appButton';
import MemberSelector from './memberSelector';
import teamService from '../../services/teamService';
import userService from '../../services/userService';
import useTaskStore from '../../../store/taskStore';
import Colors from '../../styles/color';
const idOf = value => value?._id || value;
export default function TaskReviewOwnership({ task }) {
  const [visible, setVisible] = useState(false), [teams, setTeams] = useState([]), [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]), [selected, setSelected] = useState([]), [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const reassign = useTaskStore(state => state.reassignReview);
  const ownershipChanged = idOf(team) !== idOf(task.teamId)
    || selected.map(idOf).sort().join(',') !== (task.assignedTo || []).map(idOf).sort().join(',');
  const selectTeam = async value => {
    setBusy(true); setError(''); setTeam(value); setSelected([]); setMembers([]);
    try { const response = await userService.getUsersByTeam(value._id); setMembers(response.data.filter(user => user.isActive !== false)); }
    catch (err) { setError(err?.error || 'Could not load team members. Select the team to retry.'); }
    finally { setBusy(false); }
  };
  const open = async () => {
    setVisible(true); setBusy(true); setError(''); setTeams([]); setTeam(null); setMembers([]); setSelected([]);
    try {
      let page = 1, pages = 1; const rows = [];
      do { const response = await teamService.getAllTeams({ page, limit: 100 }); rows.push(...response.data); pages = response.pagination?.pages || response.pagination?.totalPages || 1; page++; } while (page <= pages);
      setTeams(rows);
      const current = rows.find(value => value._id === idOf(task.teamId));
      if (current) { await selectTeam(current); setSelected(task.assignedTo || []); }
    } catch (err) { setError(err?.error || 'Could not load teams. Close and retry.'); }
    finally { setBusy(false); }
  };
  const button = (text, onPress, disabled = false) => <AppButton text={text} onPress={onPress} disabled={busy || disabled}
    style={{ width: '100%', height: 'auto', minHeight: 44, padding: 12, borderRadius: 12 }} textStyle={{ fontSize: 14 }} />;
  return <>
    {button('Reassign (HR)', open)}
    <Modal visible={visible} transparent onRequestClose={() => !busy && setVisible(false)}>
      <ScrollView style={{ backgroundColor: '#0008' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={{ maxWidth: 520, width: '100%', alignSelf: 'center', backgroundColor: Colors.white, borderRadius: 24, padding: 20, gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Reassign task</Text>
          <Text>Changing the team or assignees returns this task to In Progress. The new assignees must submit it again.</Text>
          {busy && <ActivityIndicator />}{!!error && <Text accessibilityRole="alert">{error}</Text>}
          {teams.map(value => <View key={value._id}>{button(`${team?._id === value._id ? '✓ ' : ''}${value.name}`, () => selectTeam(value))}</View>)}
          {button(`Select assignees (${selected.length})`, () => setPicker(true), !members.length)}
          <Text>{selected.map(person => person.profile?.fullName || person.email).join(', ')}</Text>
          {button('Reassign and return to In Progress', async () => {
            setBusy(true); setError('');
            try { await reassign(task._id, { teamId: team._id, assignedTo: selected.map(idOf) }); setVisible(false); }
            catch (err) { setError(err?.error || 'Could not reassign task'); }
            finally { setBusy(false); }
          }, !team || !selected.length || !ownershipChanged)}
          {button('Cancel', () => setVisible(false))}
        </View>
      </ScrollView>
    </Modal>
    {picker && <MemberSelector visible members={members} selectedMembers={selected} onClose={() => setPicker(false)} onConfirm={value => { setSelected(value); setPicker(false); }} />}
  </>;
}
