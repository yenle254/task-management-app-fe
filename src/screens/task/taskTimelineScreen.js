import { getTaskStatus } from '../../utils/taskStatusMap';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Marker, Path, Rect, Text as SvgText, Line } from 'react-native-svg';
import HeaderWithBackButton from '../../components/headerWithBackButton';
import { dateKey } from '../../components/task/taskFilterBar';
import useTaskStore from '../../../store/taskStore';
import Colors from '../../styles/color';
const monday = value => { const date = new Date(value); date.setDate(date.getDate() - (date.getDay() + 6) % 7); date.setHours(0, 0, 0, 0); return date; };
const plusDays = (date, count) => { const result = new Date(date); result.setDate(result.getDate() + count); return result; };
export default function TaskTimelineScreen({ navigation, route }) {
  const [week, setWeek] = useState(() => monday(new Date()));
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const { timelineTasks, getTimeline } = useTaskStore();
  const from = dateKey(week), to = dateKey(plusDays(week, 6));
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { await getTimeline({ from, to, scope: route.params?.scope || 'self', ...(route.params?.teamId ? { teamId: route.params.teamId } : {}) }); }
    catch (err) { setError(err?.error || 'Could not load timeline'); }
    finally { setLoading(false); }
  }, [from, to, getTimeline, route.params]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const rows = timelineTasks.filter(task => task.dueDate);
  const origin = 210, unit = 90, rowHeight = 58;
  const chartHeight = Math.max(180, rows.length * rowHeight + 60);
  // Android SVG renders into a bitmap. Bound it to the visible window rather
  // than allocating one bitmap for every task in the complete result set.
  const windowTop = Math.max(0, Math.min(chartHeight - viewportHeight, Math.floor(scrollY / rowHeight) * rowHeight - rowHeight * 2));
  const windowHeight = Math.min(chartHeight - windowTop, viewportHeight + rowHeight * 4);
  const visibleRow = i => 40 + i * rowHeight >= windowTop - rowHeight && 40 + i * rowHeight <= windowTop + windowHeight;
  const dayOffset = value => { const date = new Date(value); return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(week.getFullYear(), week.getMonth(), week.getDate())) / 86400000; };
  const geometry = task => {
    const start = Math.max(0, dayOffset(task.startDate || task.dueDate));
    const end = Math.min(7, dayOffset(task.dueDate) + 1);
    return { x: origin + start * unit, width: Math.max(8, (end - start) * unit) };
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
    <HeaderWithBackButton title="Task timeline" onBackPress={() => navigation.goBack()} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
      <TouchableOpacity onPress={() => setWeek(plusDays(week, -7))}><Text>‹ Previous</Text></TouchableOpacity>
      <Text>{from} – {to}</Text>
      <TouchableOpacity onPress={() => setWeek(plusDays(week, 7))}><Text>Next ›</Text></TouchableOpacity>
    </View>
    {loading && <ActivityIndicator />}
    {!!error && <TouchableOpacity onPress={load}><Text style={{ color: '#b42318', padding: 16 }}>{error} · Retry</Text></TouchableOpacity>}
    <Text style={{ padding: 16 }}>Tap a task to open it. Arrows connect dependencies visible in this week.</Text>
    <ScrollView onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
      onScroll={event => setScrollY(event.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
      <ScrollView horizontal>
      <View style={{ width: origin + unit * 7 + 20, height: chartHeight }}>
      <Svg width={origin + unit * 7 + 20} height={windowHeight}
        viewBox={`0 ${windowTop} ${origin + unit * 7 + 20} ${windowHeight}`}
        style={{ position: 'absolute', top: windowTop }}>

        <Defs><Marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><Path d="M0,0 L8,4 L0,8" fill="#666" /></Marker></Defs>
        {Array.from({ length: 7 }, (_, i) => <React.Fragment key={i}>
          <SvgText x={origin + i * unit + 6} y={22} fontSize={12}>{dateKey(plusDays(week, i)).slice(5)}</SvgText>
          <Line x1={origin + i * unit} x2={origin + i * unit} y1={32} y2={rows.length * rowHeight + 60} stroke="#eee" />
        </React.Fragment>)}
        {rows.flatMap((task, i) => (task.dependencies || []).map(dependency => {
          const j = rows.findIndex(item => item._id === (dependency._id || dependency));
          if (j < 0) return null;
          const source = geometry(rows[j]), target = geometry(task);
          const sx = source.x + source.width, sy = 57 + j * rowHeight, ty = 57 + i * rowHeight;
          return <Path key={task._id + '-' + j} d={'M' + sx + ',' + sy + ' H' + (sx + 10) + ' V' + ty + ' H' + target.x}
            fill="none" stroke="#666" strokeWidth={1.5} markerEnd="url(#arrow)" />;
        }))}
        {rows.map((task, i) => {
          if (!visibleRow(i)) return null;
          const bar = geometry(task), y = 40 + i * rowHeight;
          const open = () => navigation.navigate('TaskDetail', { taskId: task._id });
          return <React.Fragment key={task._id}>
            <SvgText x={8} y={y + 14} fontSize={11} onPress={open} {...(Platform.OS === 'web' ? {} : { accessible: true, accessibilityRole: 'button', accessibilityLabel: task.title + ', ' + getTaskStatus(task.status).label })}>{(task.parentTaskId ? '↳ ' : '') + task.title.slice(0, 17)}</SvgText>
            <SvgText x={8} y={y + 31} fontSize={11} fill={getTaskStatus(task.status).color} onPress={open}>{getTaskStatus(task.status).label}</SvgText>
            <Rect x={bar.x} y={y} width={bar.width} height={32} rx={6} fill={getTaskStatus(task.status).bgColor} onPress={open} />
            <Rect x={bar.x} y={y + 27} width={bar.width * (task.progress || 0) / 100} height={5} fill={Colors.primary} />
            <SvgText x={bar.x + 5} y={y + 20} fontSize={11} fill={Colors.primary} onPress={open}>{task.progress || 0}%</SvgText>
          </React.Fragment>;
        })}
      </Svg>
      </View>
    </ScrollView>{!loading && !rows.length && <Text style={{ padding: 20 }}>No scheduled tasks this week.</Text>}</ScrollView>
  </SafeAreaView>;
}
