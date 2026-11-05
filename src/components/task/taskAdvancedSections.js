import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import useTaskStore from '../../../store/taskStore';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/authContext';
import { FormInput } from './taskFormFields';
import { TagInput, advancedPayload } from './advancedTaskFields';
import MemberSelector from './memberSelector';
import Avatar from '../avatar';
import TaskCategory from '../taskCategory';
import Colors from '../../styles/color';

const keyOf = value => value?._id || value;
const Action = ({ children, onPress, disabled = false }) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
  style={{ paddingVertical: 9, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: Colors.primary }}>{children}</Text></TouchableOpacity>;
const Section = ({ title, children }) => <View style={{ margin: 20, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderColor: '#eee', gap: 6 }}>
  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>{children}</View>;
export default function TaskAdvancedSections({ task, navigation }) {
  const store = useTaskStore();
  const locked = task.status === 'in_review';
  const { user, canManageTasks } = useAuth();
  const [children, setChildren] = useState([]);
  const [dependencies, setDependencies] = useState({ blocking: [], blockedBy: [] });
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [members, setMembers] = useState(null);
  const [picker, setPicker] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePages, setCandidatePages] = useState(0);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [pickerError, setPickerError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [childResponse, dependencyResponse, historyResponse] = await Promise.all([
        taskService.getTaskChildren(task._id), taskService.getDependencies(task._id), taskService.getTaskHistory(task._id)
      ]);
      setChildren(childResponse.data); setDependencies(dependencyResponse.data); setHistory(historyResponse.data);
    } catch (err) { setError(err?.error || err.message || 'Could not load task activity'); }
    finally { setLoading(false); }
  }, [task._id]);
  useEffect(() => { reload(); }, [reload, task.updatedAt]);
  const run = async action => {
    if (busy || locked) return false;
    setBusy(true);
    try { await action(); await reload(); return true; }
    catch (err) { Alert.alert('Task', err?.error || err.message || 'Update failed'); return false; }
    finally { setBusy(false); }
  };
  const edit = (title, fields, initial, submit) => { if (locked) return; setValues(initial); setForm({ title, fields, submit }); };
  const confirmDelete = (label, action) => Alert.alert('Delete', label, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => run(action) }
  ]);
  const showWatchers = async () => {
    await run(async () => {
      const response = await userService.getUsersByTeam(keyOf(task.teamId));
      const list = [...(response.data || []), ...(task.assignedTo || []), task.assignedBy, user].filter(item => item?._id);
      setMembers([...new Map(list.filter(item => item.isActive !== false).map(item => [item._id, item])).values()]);
    });
  };
  const loadCandidates = useCallback(async (page = 1) => {
    if (!picker) return;
    setPickerBusy(true); setPickerError('');
    try {
      const params = { page, limit: 20, search: candidateSearch, teamId: keyOf(task.teamId) };
      const response = await (canManageTasks() ? taskService.getAllTasks(params) : taskService.getMyTasks(params));
      const items = (response.data || []).filter(item => item._id !== task._id && keyOf(item.teamId) === keyOf(task.teamId));
      setCandidates(previous => page === 1 ? items : [...previous, ...items]);
      setCandidatePage(response.page); setCandidatePages(response.pages);
    } catch (err) { setPickerError(err?.error || err.message || 'Could not load tasks'); }
    finally { setPickerBusy(false); }
  }, [picker, candidateSearch, task._id, task.teamId, canManageTasks]);
  useEffect(() => {
    if (!picker) return;
    const timer = setTimeout(() => loadCandidates(1), 300);
    return () => clearTimeout(timer);
  }, [picker, loadCandidates]);
  const canRemoveWatcher = user.role === 'hr_manager' || keyOf(task.assignedBy) === user._id;
  return <View>
    {locked && <Text style={{ margin: 16 }}>Content is locked while awaiting review. Comments remain available.</Text>}
    {(loading || busy) && <ActivityIndicator color={Colors.primary} />}
    {!!error && <Action onPress={reload}>{error} · Retry</Action>}
    <Section title="Parent and child tasks">
      {task.parentTaskId ? <View>
        <Action onPress={() => navigation.push('TaskDetail', { taskId: keyOf(task.parentTaskId) })}>Open parent task</Action>
        <Action disabled={busy || locked} onPress={() => run(() => store.removeParentTask(task._id))}>Remove parent</Action>
      </View> : <Action disabled={busy || locked} onPress={() => { setPicker('parent'); setCandidateSearch(''); }}>Set parent</Action>}
      {!children.length && <Text>No child tasks</Text>}
      {children.map(child => <Action key={child._id} onPress={() => navigation.push('TaskDetail', { taskId: child._id })}>{child.title} · {child.status}</Action>)}
    </Section>
    <Section title="Tags">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{(task.tags || []).map(tag => <TaskCategory key={tag} name={tag} />)}</View>
      {!task.tags?.length && <Text>No tags</Text>}
      <Action disabled={locked} onPress={() => edit('Edit tags', [], { tags: task.tags || [] }, value => store.setTags(task._id, value.tags))}>Edit tags</Action>
    </Section>
    <Section title="Watchers">
      {!task.watchers?.length && <Text>No watchers</Text>}
      {(task.watchers || []).map(person => <View key={keyOf(person)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar url={person.profile?.avatar} name={person.profile?.fullName || 'User'} width={32} height={32} />
        <Text style={{ flex: 1 }}>{person.profile?.fullName || person.email || 'Watcher'}</Text>
        {canRemoveWatcher && <Action disabled={busy || locked} onPress={() => run(() => store.removeWatcher(task._id, keyOf(person)))}>Remove</Action>}
      </View>)}
      <Action disabled={busy || locked} onPress={showWatchers}>Add watcher</Action>
    </Section>
    <Section title="Dependencies">
      {(dependencies.blocking.length > 0 || (task.dependencies?.length || 0) > dependencies.blockedBy.length) &&
        <Text style={{ color: '#b42318' }}>This task is blocked by unfinished or unavailable dependencies.</Text>}
      {!task.dependencies?.length && <Text>No dependencies</Text>}
      {dependencies.blockedBy.map(item => <View key={item._id}>
        <Action onPress={() => navigation.push('TaskDetail', { taskId: item._id })}>{item.title} · {item.status}</Action>
        <Action disabled={busy || locked} onPress={() => run(() => store.removeDependency(task._id, item._id))}>Remove dependency</Action>
      </View>)}
      {(task.dependencies || []).filter(id => !dependencies.blockedBy.some(item => item._id === keyOf(id))).map(id =>
        <Action key={keyOf(id)} disabled={busy || locked} onPress={() => run(() => store.removeDependency(task._id, keyOf(id)))}>Remove unavailable dependency</Action>)}
      <Action disabled={busy || locked} onPress={() => { setPicker('dependency'); setCandidateSearch(''); }}>Add dependency</Action>
    </Section>
    <Section title="Checklists">
      {!task.checklists?.length && <Text>No checklists</Text>}
      {(task.checklists || []).map(checklist => <View key={checklist._id} style={{ padding: 12, borderRadius: 12, backgroundColor: '#f6f5fa', marginBottom: 8 }}>
        <Text style={{ fontWeight: '600' }}>{checklist.title} · {checklist.items.filter(item => item.isCompleted).length}/{checklist.items.length}</Text>
        <Action disabled={locked} onPress={() => edit('Rename checklist', ['title'], { title: checklist.title }, value => store.updateChecklist(task._id, checklist._id, value.title))}>Rename</Action>
        {checklist.items.map(item => <View key={item._id}>
          <Action disabled={busy || locked} onPress={() => run(() => store.updateChecklistItem(task._id, checklist._id, item._id, { isCompleted: !item.isCompleted }))}>
            {item.isCompleted ? '☑ ' : '☐ '}{item.text}
          </Action>
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <Action disabled={locked} onPress={() => edit('Edit item', ['text'], { text: item.text }, value => store.updateChecklistItem(task._id, checklist._id, item._id, value))}>Edit</Action>
            <Action disabled={locked} onPress={() => confirmDelete('Delete this checklist item?', () => store.deleteChecklistItem(task._id, checklist._id, item._id))}>Delete</Action>
          </View>
        </View>)}
        <Action disabled={locked} onPress={() => edit('Add checklist item', ['text'], { text: '' }, value => store.addChecklistItem(task._id, checklist._id, value.text))}>Add item</Action>
        <Action disabled={locked} onPress={() => confirmDelete('Delete this checklist?', () => store.deleteChecklist(task._id, checklist._id))}>Delete checklist</Action>
      </View>)}
      <Action disabled={locked} onPress={() => edit('Add checklist', ['title'], { title: '' }, value => store.addChecklist(task._id, value.title))}>Add checklist</Action>
    </Section>
    <Section title="Estimate and time">
      <Text>Estimate: {task.estimatedMinutes == null ? 'Not set' : task.estimatedMinutes + ' min'} · Actual: {task.actualMinutes || 0} min</Text>
      <Text>Story points: {task.storyPoints ?? 'Not set'}</Text>
      <Action disabled={locked} onPress={() => edit('Estimate', ['estimatedMinutes', 'storyPoints'], {
        estimatedMinutes: String(task.estimatedMinutes ?? ''), storyPoints: String(task.storyPoints ?? '')
      }, value => {
        const { estimatedMinutes, storyPoints } = advancedPayload({ ...value, tags: [] });
        return store.updateEstimate(task._id, { estimatedMinutes, storyPoints });
      })}>Edit estimate</Action>
      <Action disabled={locked} onPress={() => edit('Log time', ['minutes', 'note'], { minutes: '', note: '' }, value => {
        const minutes = Number(value.minutes);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error('Enter 1–1440 whole minutes');
        return store.addTimeEntry(task._id, { minutes, note: value.note });
      })}>Log time</Action>
      {!task.timeEntries?.length && <Text>No time logged</Text>}
      {(task.timeEntries || []).map(entry => <View key={entry._id} style={{ paddingVertical: 8 }}>
        <Text>{entry.minutes} min · {entry.userId?.profile?.fullName || 'User'} · {new Date(entry.loggedAt).toLocaleString()}</Text>
        {!!entry.note && <Text>{entry.note}</Text>}
        {(user.role === 'hr_manager' || keyOf(entry.userId) === user._id) &&
          <Action disabled={locked} onPress={() => confirmDelete('Delete this time entry?', () => store.deleteTimeEntry(task._id, entry._id))}>Delete entry</Action>}
      </View>)}
    </Section>
    <Section title="Activity / History">
      {!history.length && !loading && <Text>No recorded history</Text>}
      {history.map((entry, index) => <View key={index} style={{ borderLeftWidth: 2, borderColor: Colors.primary, paddingLeft: 14, paddingBottom: 14 }}>
        <Text style={{ fontWeight: '600' }}>{entry.from === null ? 'Created' : entry.from + ' → ' + entry.to}</Text>
        <Text>{entry.by?.profile?.fullName || 'Unknown user'} · {new Date(entry.at).toLocaleString()}</Text>
      </View>)}
    </Section>
    {members && <MemberSelector visible members={members} selectedMembers={[]} loading={busy} onClose={() => setMembers(null)}
      onConfirm={async selected => { if (await run(async () => { for (const member of selected) await store.addWatcher(task._id, member._id); })) setMembers(null); }} />}
    <Modal visible={!!form} animationType="slide" onRequestClose={() => setForm(null)}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56 }}>
        <Text style={{ fontSize: 22, marginBottom: 20 }}>{form?.title}</Text>
        {form?.title === 'Edit tags' && <TagInput tags={values.tags} onChange={tags => setValues({ tags })} />}
        {form?.fields.map(field => <FormInput key={field} label={field} value={values[field] || ''} onChangeText={text => setValues({ ...values, [field]: text })} />)}
        <Action disabled={busy || locked} onPress={async () => { if (await run(() => form.submit(values))) setForm(null); }}>Save</Action>
        <Action disabled={busy || locked} onPress={() => setForm(null)}>Cancel</Action>
      </ScrollView>
    </Modal>
    <Modal visible={!!picker} animationType="slide" onRequestClose={() => setPicker(null)}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56 }}>
        <Text style={{ fontSize: 22 }}>Select {picker === 'parent' ? 'parent task' : 'dependency'}</Text>
        <FormInput label="Search tasks" value={candidateSearch} onChangeText={setCandidateSearch} />
        {!!pickerError && <Action onPress={() => loadCandidates(1)}>{pickerError} · Retry</Action>}
        {pickerBusy && <ActivityIndicator />}
        {!pickerBusy && !candidates.length && <Text>No matching accessible tasks</Text>}
        {candidates.map(item => <Action key={item._id} disabled={busy || locked} onPress={async () => {
          if (await run(() => picker === 'parent' ? store.setParentTask(task._id, item._id) : store.addDependencies(task._id, [item._id]))) setPicker(null);
        }}>{item.title} · {item.status}</Action>)}
        {candidatePage < candidatePages && <Action disabled={pickerBusy} onPress={() => loadCandidates(candidatePage + 1)}>Load more</Action>}
        <Action onPress={() => setPicker(null)}>Cancel</Action>
      </ScrollView>
    </Modal>
  </View>;
}
