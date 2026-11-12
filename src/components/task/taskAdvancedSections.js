import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import useTaskStore from '../../../store/taskStore';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/authContext';
import { FormInput } from './taskFormFields';
import { TagInput, advancedPayload } from './advancedTaskFields';
import MemberSelector from './memberSelector';
import TaskPickerModal from './taskPickerModal';
import EstimateModal from './estimateModal';
import LogTimeModal from './logTimeModal';
import ChecklistEntryModal from './checklistEntryModal';
import TaskDependenciesCard from './taskDependenciesCard';
import Avatar from '../avatar';
import { TaskHierarchyCard, TaskTagsCard } from './taskRelationshipCards';
import Colors from '../../styles/color';

const keyOf = value => value?._id || value;
const Action = ({ children, onPress, disabled = false }) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
  style={{ paddingVertical: 9, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: Colors.primary }}>{children}</Text></TouchableOpacity>;
const Section = ({ title, children }) => <View style={{ margin: 20, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderColor: '#eee', gap: 6 }}>
  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{title}</Text>{children}</View>;

const ChecklistSquareIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="5" stroke="#5B4EF8" strokeWidth="1.8" />
    <Path d="M8.5 12.5L11 15L15.5 9.5" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronIcon = ({ collapsed }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d={collapsed ? 'M6 9L12 15L18 9' : 'M18 15L12 9L6 15'}
      stroke="#5B4EF8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleIcon = ({ checked }) => (
  checked ? (
    <View style={styles.checkboxChecked}>
      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <Path d="M5 13L9.5 17.5L19 7" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  ) : (
    <View style={styles.checkboxUnchecked} />
  )
);

const PlusSmallIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#5B4EF8" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClockHeaderIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#5B4EF8" strokeWidth="1.8" />
    <Path d="M12 7.5V12L15 14" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HourglassIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M6 3H18M6 21H18M7.5 3V6.5C7.5 8.8 9.5 10.7 12 12C9.5 13.3 7.5 15.2 7.5 17.5V21M16.5 3V6.5C16.5 8.8 14.5 10.7 12 12C14.5 13.3 16.5 15.2 16.5 17.5V21" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlayBadgeIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Polygon points="8,5 19,12 8,19" fill="#5B4EF8" />
  </Svg>
);

const StoryPointsDocIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M14 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V8L14 3Z" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 3V8H19M9 13H15M9 17H13" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PencilSmallIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <Path d="M16.5 3.5C17.3 2.7 18.7 2.7 19.5 3.5L20.5 4.5C21.3 5.3 21.3 6.7 20.5 7.5L8 20L3 21L4 16L16.5 3.5Z" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockSmallIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#5B4EF8" strokeWidth="1.8" />
    <Path d="M12 7.5V12L14.8 13.8" stroke="#5B4EF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
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
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
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
  const checklists = task.checklists || [];
  const totalChecklistItems = checklists.reduce((sum, cl) => sum + (cl.items?.length || 0), 0);
  const completedChecklistItems = checklists.reduce(
    (sum, cl) => sum + (cl.items || []).filter(item => item.isCompleted).length,
    0
  );
  const addingChecklist = form?.title === 'Add checklist' || form?.title === 'Add checklist item';
  const checklistField = form?.title === 'Add checklist item' ? 'text' : 'title';
  return <View>
    {locked && <Text style={{ margin: 16 }}>Content is locked while awaiting review. Comments remain available.</Text>}
    {(loading || busy) && <ActivityIndicator color={Colors.primary} />}
    {!!error && <Action onPress={reload}>{error} · Retry</Action>}
    <TaskHierarchyCard
      task={task}
      childTasks={children}
      loading={loading}
      error={error}
      onRetry={reload}
      disabled={busy || locked}
      onOpenTask={taskId => navigation.push('TaskDetail', { taskId })}
      onSetParent={() => { setPicker('parent'); setCandidateSearch(''); }}
      onRemoveParent={() => run(() => store.removeParentTask(task._id))}
    />
    <TaskTagsCard
      tags={task.tags || []}
      disabled={busy || locked}
      onEdit={() => edit('Edit tags', [], { tags: task.tags || [] }, value => store.setTags(task._id, value.tags))}
    />
    <Section title="Watchers">
      {!task.watchers?.length && <Text>No watchers</Text>}
      {(task.watchers || []).map(person => <View key={keyOf(person)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar url={person.profile?.avatar} name={person.profile?.fullName || 'User'} width={32} height={32} />
        <Text style={{ flex: 1 }}>{person.profile?.fullName || person.email || 'Watcher'}</Text>
        {canRemoveWatcher && <Action disabled={busy || locked} onPress={() => run(() => store.removeWatcher(task._id, keyOf(person)))}>Remove</Action>}
      </View>)}
      <Action disabled={busy || locked} onPress={showWatchers}>Add watcher</Action>
    </Section>
    <TaskDependenciesCard
      dependencyIds={task.dependencies || []}
      dependencies={dependencies}
      loading={loading}
      error={error}
      disabled={busy || locked}
      onRetry={reload}
      onOpenTask={taskId => navigation.push('TaskDetail', { taskId })}
      onRemove={dependencyId => run(() => store.removeDependency(task._id, dependencyId))}
      onAdd={() => { setPicker('dependency'); setCandidateSearch(''); }}
    />

    {/* Checklist Card */}
    <View style={styles.card}>
      <Text style={styles.srOnly}>Checklists</Text>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTitleGroup}>
          <ChecklistSquareIcon />
          <Text style={styles.cardTitle}>Checklist</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.checklistProgressBtn}
          onPress={() => setChecklistCollapsed(prev => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.checklistProgressText}>
            {completedChecklistItems} / {totalChecklistItems}
          </Text>
          <ChevronIcon collapsed={checklistCollapsed} />
        </TouchableOpacity>
      </View>

      {!checklistCollapsed && (
        <View style={styles.innerBox}>
          {!checklists.length && (
            <Text style={styles.emptySubtleText}>No checklists</Text>
          )}

          {checklists.map((checklist, cIdx) => {
            const doneCount = (checklist.items || []).filter(item => item.isCompleted).length;
            const totalCount = (checklist.items || []).length;
            return (
              <View
                key={checklist._id}
                style={cIdx > 0 ? styles.checklistGroupDivider : null}
              >
                <Text style={styles.srOnly}>
                  {`${checklist.title} · ${doneCount}/${totalCount}`}
                </Text>

                {checklists.length > 1 || checklist.title ? (
                  <View style={styles.checklistSubheader}>
                    <Text style={styles.checklistSubheaderTitle} numberOfLines={1}>
                      {checklist.title}
                    </Text>
                    <View style={styles.inlineLinkRow}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={locked}
                        onPress={() => edit('Add checklist item', ['text'], { text: '' }, value => store.addChecklistItem(task._id, checklist._id, value.text))}
                      >
                        <Text style={styles.inlineLinkText}>Add item</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={locked}
                        onPress={() => edit('Rename checklist', ['title'], { title: checklist.title }, value => store.updateChecklist(task._id, checklist._id, value.title))}
                      >
                        <Text style={styles.inlineLinkText}>Rename</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={locked}
                        onPress={() => confirmDelete('Delete this checklist?', () => store.deleteChecklist(task._id, checklist._id))}
                      >
                        <Text style={[styles.inlineLinkText, styles.dangerLinkText]}>Delete checklist</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {(checklist.items || []).map(item => (
                  <View key={item._id} style={styles.checklistItemRow}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={busy || locked}
                      style={styles.checklistItemToggle}
                      activeOpacity={0.75}
                      onPress={() => run(() => store.updateChecklistItem(task._id, checklist._id, item._id, { isCompleted: !item.isCompleted }))}
                    >
                      <CheckCircleIcon checked={!!item.isCompleted} />
                      <Text
                        style={[
                          styles.checklistItemText,
                          item.isCompleted && styles.checklistItemTextDone,
                        ]}
                      >
                        {item.text}
                      </Text>
                      <Text style={styles.srOnly}>
                        {`${item.isCompleted ? '☑ ' : '☐ '}${item.text}`}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.itemManageBtns}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={locked}
                        onPress={() => edit('Edit item', ['text'], { text: item.text }, value => store.updateChecklistItem(task._id, checklist._id, item._id, value))}
                      >
                        <Text style={styles.itemActionLink}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={locked}
                        onPress={() => confirmDelete('Delete this checklist item?', () => store.deleteChecklistItem(task._id, checklist._id, item._id))}
                      >
                        <Text style={[styles.itemActionLink, styles.dangerLinkText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <TouchableOpacity
            accessibilityRole="button"
            disabled={locked}
            style={[styles.addChecklistRow, locked && styles.disabledBtn]}
            activeOpacity={0.75}
            onPress={() => edit('Add checklist', ['title'], { title: '' }, value => store.addChecklist(task._id, value.title))}
          >
            <PlusSmallIcon />
            <Text style={styles.addChecklistText}>Add checklist</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* Estimate and time Card */}
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTitleGroup}>
          <ClockHeaderIcon />
          <Text style={styles.cardTitle}>Estimate and time</Text>
        </View>
      </View>

      <Text style={styles.srOnly}>
        {`Estimate: ${task.estimatedMinutes == null ? 'Not set' : task.estimatedMinutes + ' min'} · Actual: ${task.actualMinutes || 0} min`}
      </Text>

      <View style={styles.innerBox}>
        <View style={styles.estimateTopGrid}>
          <View style={[styles.estimateMetricCol, styles.estimateMetricColLeft]}>
            <View style={styles.metricIconCircle}>
              <HourglassIcon />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricLabel}>Estimate</Text>
              <Text style={styles.metricValue}>
                {task.estimatedMinutes == null ? 'Not set' : `${task.estimatedMinutes} min`}
              </Text>
            </View>
          </View>

          <View style={[styles.estimateMetricCol, styles.estimateMetricColRight]}>
            <View style={styles.metricIconCircle}>
              <PlayBadgeIcon />
            </View>
            <View style={styles.metricTextCol}>
              <Text style={styles.metricLabel}>Actual</Text>
              <Text style={styles.metricValue}>{`${task.actualMinutes || 0} min`}</Text>
            </View>
          </View>
        </View>

        <View style={styles.storyPointsRow}>
          <View style={styles.metricIconCircle}>
            <StoryPointsDocIcon />
          </View>
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel}>Story points</Text>
            <Text style={styles.metricValue}>{task.storyPoints ?? 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.estimateBottomActions}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={locked}
            style={[styles.estimateActionBtn, styles.estimateActionBtnLeft, locked && styles.disabledBtn]}
            activeOpacity={0.75}
            onPress={() => edit('Estimate', ['estimatedMinutes', 'storyPoints'], {
              estimatedMinutes: String(task.estimatedMinutes ?? ''), storyPoints: String(task.storyPoints ?? '')
            }, value => {
              const { estimatedMinutes, storyPoints } = advancedPayload({ ...value, tags: [] });
              return store.updateEstimate(task._id, { estimatedMinutes, storyPoints });
            })}
          >
            <PencilSmallIcon />
            <Text style={styles.estimateActionBtnText}>Edit estimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={locked}
            style={[styles.estimateActionBtn, locked && styles.disabledBtn]}
            activeOpacity={0.75}
            onPress={() => edit('Log time', ['minutes', 'note'], { minutes: '', note: '' }, value => {
              const minutes = Number(value.minutes);
              if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error('Enter 1–1440 whole minutes');
              return store.addTimeEntry(task._id, { minutes, note: value.note });
            })}
          >
            <ClockSmallIcon />
            <Text style={styles.estimateActionBtnText}>Log time</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!task.timeEntries?.length ? (
        <Text style={styles.srOnly}>No time logged</Text>
      ) : (
        <View style={styles.timeEntriesList}>
          {(task.timeEntries || []).map(entry => (
            <View key={entry._id} style={styles.timeEntryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeEntryTitle}>
                  {entry.minutes} min · {entry.userId?.profile?.fullName || 'User'} · {new Date(entry.loggedAt).toLocaleString()}
                </Text>
                {!!entry.note && <Text style={styles.timeEntryNote}>{entry.note}</Text>}
              </View>
              {(user.role === 'hr_manager' || keyOf(entry.userId) === user._id) && (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={locked}
                  onPress={() => confirmDelete('Delete this time entry?', () => store.deleteTimeEntry(task._id, entry._id))}
                >
                  <Text style={[styles.itemActionLink, styles.dangerLinkText]}>Delete entry</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
    <Section title="Activity / History">
      {!history.length && !loading && <Text>No recorded history</Text>}
      {history.map((entry, index) => <View key={index} style={{ borderLeftWidth: 2, borderColor: Colors.primary, paddingLeft: 14, paddingBottom: 14 }}>
        <Text style={{ fontWeight: '600' }}>{entry.from === null ? 'Created' : entry.from + ' → ' + entry.to}</Text>
        <Text>{entry.by?.profile?.fullName || 'Unknown user'} · {new Date(entry.at).toLocaleString()}</Text>
      </View>)}
    </Section>
    {members && <MemberSelector visible members={members} selectedMembers={[]} loading={busy} onClose={() => setMembers(null)}
      onConfirm={async selected => { if (await run(async () => { for (const member of selected) await store.addWatcher(task._id, member._id); })) setMembers(null); }} />}
    {form?.title === 'Estimate' && <EstimateModal
      visible
      values={values}
      onChange={setValues}
      busy={busy}
      locked={locked}
      onClose={() => setForm(null)}
      onSave={async () => { if (await run(() => form.submit(values))) setForm(null); }}
    />}
    {form?.title === 'Log time' && <LogTimeModal
      visible
      values={values}
      onChange={setValues}
      busy={busy}
      locked={locked}
      onClose={() => setForm(null)}
      onSave={async () => { if (await run(() => form.submit(values))) setForm(null); }}
    />}
    {addingChecklist && <ChecklistEntryModal
      visible
      item={form.title === 'Add checklist item'}
      value={values[checklistField] || ''}
      onChangeText={text => setValues({ ...values, [checklistField]: text })}
      busy={busy}
      locked={locked}
      onClose={() => setForm(null)}
      onAdd={async text => { if (await run(() => form.submit({ ...values, [checklistField]: text }))) setForm(null); }}
    />}
    <Modal visible={!!form && !addingChecklist && !['Estimate', 'Log time'].includes(form.title)} animationType="slide" onRequestClose={() => setForm(null)}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 56 }}>
        <Text style={{ fontSize: 22, marginBottom: 20 }}>{form?.title}</Text>
        {form?.title === 'Edit tags' && <TagInput tags={values.tags} disabled={busy || locked} onChange={tags => setValues({ tags })} />}
        {form?.fields.map(field => <FormInput key={field} label={field} value={values[field] || ''} onChangeText={text => setValues({ ...values, [field]: text })} />)}
        <Action disabled={busy || locked} onPress={async () => { if (await run(() => form.submit(values))) setForm(null); }}>Save</Action>
        <Action disabled={busy || locked} onPress={() => setForm(null)}>Cancel</Action>
      </ScrollView>
    </Modal>
    <TaskPickerModal
      visible={!!picker}
      title={picker === 'dependency' ? 'Select dependency' : 'Select parent task'}
      subtitle={picker === 'dependency' ? 'Search and choose a blocking task' : 'Search and choose a parent task'}
      confirmLabel={picker === 'dependency' ? 'Add dependency' : 'Select task'}
      search={candidateSearch}
      onSearchChange={setCandidateSearch}
      tasks={candidates}
      loading={pickerBusy}
      error={pickerError}
      onRetry={() => loadCandidates(1)}
      hasMore={candidatePage < candidatePages}
      onLoadMore={() => loadCandidates(candidatePage + 1)}
      busy={busy || locked}
      onClose={() => setPicker(null)}
      onConfirm={async item => {
        if (await run(() => picker === 'parent' ? store.setParentTask(task._id, item._id) : store.addDependencies(task._id, [item._id]))) setPicker(null);
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF8',
    shadowColor: '#3B2ED0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  checklistProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  checklistProgressText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  innerBox: {
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  emptySubtleText: {
    fontSize: 13.5,
    color: '#94A3B8',
    paddingVertical: 10,
  },
  checklistGroupDivider: {
    borderTopWidth: 1,
    borderTopColor: '#ECEEF8',
    marginTop: 4,
    paddingTop: 4,
  },
  checklistSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF8',
    gap: 8,
  },
  checklistSubheaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5B4EF8',
  },
  dangerLinkText: {
    color: '#DC2626',
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF8',
    gap: 10,
  },
  checklistItemToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5B4EF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#0F172A',
  },
  checklistItemTextDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  itemManageBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemActionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  addChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingLeft: 3,
  },
  addChecklistText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4EF8',
  },
  estimateTopGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF8',
  },
  estimateMetricCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  estimateMetricColLeft: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingRight: 10,
  },
  estimateMetricColRight: {
    paddingLeft: 14,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextCol: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  storyPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF8',
  },
  estimateBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  estimateActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  estimateActionBtnLeft: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  estimateActionBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5B4EF8',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  timeEntriesList: {
    marginTop: 10,
    paddingHorizontal: 6,
    gap: 6,
  },
  timeEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FE',
    gap: 10,
  },
  timeEntryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeEntryNote: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
});
