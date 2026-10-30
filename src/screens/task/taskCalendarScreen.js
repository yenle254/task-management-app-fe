import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import { getDaysInMonth } from '../../components/task/calendarModal';
import { dateKey } from '../../components/task/taskFilterBar';
import useTaskStore from '../../../store/taskStore';
import Colors from '../../styles/color';

export default function TaskCalendarScreen({ navigation, route }) {
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const { calendarTasks, getCalendar } = useTaskStore();
  const from = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const to = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { await getCalendar({ from, to, scope: route.params?.scope || 'self', ...(route.params?.teamId ? { teamId: route.params.teamId } : {}) }); }
    catch (err) { setError(err?.error || 'Could not load calendar'); }
    finally { setLoading(false); }
  }, [from, to, getCalendar, route.params]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const days = getDaysInMonth(month);
  while (days.length % 7) days.push(null);
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const open = task => navigation.navigate('TaskDetail', { taskId: task._id });
  return <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <HeaderWithBackButton title="Task calendar" onBackPress={() => navigation.goBack()} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
      <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text>‹ Previous</Text></TouchableOpacity>
      <Text>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
      <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text>Next ›</Text></TouchableOpacity>
    </View>
    {loading && <ActivityIndicator />}
    {!!error && <TouchableOpacity onPress={load}><Text style={{ color: '#b42318', padding: 16 }}>{error} · Retry</Text></TouchableOpacity>}
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <View style={{ flexDirection: 'row' }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <Text key={day} style={{ width: '14.285%', textAlign: 'center' }}>{day}</Text>)}</View>
      {weeks.map((week, index) => {
        const active = week.filter(Boolean);
        const first = dateKey(active[0]), last = dateKey(active[active.length - 1]);
        const tasks = calendarTasks.filter(task => {
          if (!task.dueDate) return false;
          const end = dateKey(new Date(task.dueDate)), start = task.startDate ? dateKey(new Date(task.startDate)) : end;
          return start <= last && end >= first;
        });
        return <View key={index} style={{ borderTopWidth: 1, borderColor: '#ddd', paddingVertical: 10, minHeight: 100 }}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>{week.map((day, i) => <Text key={i} style={{ width: '14.285%', textAlign: 'center' }}>{day?.getDate()}</Text>)}</View>
          {tasks.map(task => {
            const end = dateKey(new Date(task.dueDate)), start = task.startDate ? dateKey(new Date(task.startDate)) : end;
            const indices = week.map((day, i) => day && dateKey(day) >= start && dateKey(day) <= end ? i : -1).filter(i => i >= 0);
            if (!indices.length) return null;
            return <TouchableOpacity key={task._id} onPress={() => open(task)} accessibilityLabel={task.title + ', deadline ' + end}
              style={{ marginLeft: (indices[0] * 100 / 7) + '%', width: (indices.length * 100 / 7) + '%', backgroundColor: task.status === 'done' ? '#ddf5df' : '#eee8ff', borderRadius: 5, padding: 5, marginBottom: 4 }}>
              <Text numberOfLines={1} style={{ color: Colors.primary, fontSize: 11 }}>{task.title}</Text>
            </TouchableOpacity>;
          })}
        </View>;
      })}
      {!loading && !calendarTasks.length && <Text>No tasks in this month.</Text>}
    </ScrollView>
  </SafeAreaView>;
}
