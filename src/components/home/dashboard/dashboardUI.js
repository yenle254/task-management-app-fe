import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import Colors from '../../../styles/color';
import { displayNumber, isNumber, records } from '../../../utils/dashboardData';
import { baseChartConfig, DISTRIBUTION_COLORS, DISTRIBUTION_LABELS, rgbaFromHex } from './chartConfig';

export const Note = ({ children }) => <Text style={styles.note}>{children}</Text>;
export const Empty = ({ children = 'No data available.' }) => <Text accessibilityRole="text" style={styles.empty}>{children}</Text>;
export const Action = ({ children, onPress, disabled = false, style, textStyle }) => (
  <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.action, style, disabled && { opacity: 0.45 }]}>
    <Text style={[styles.actionText, textStyle]}>{children}</Text>
  </Pressable>
);

export function DashboardGrid({ children }) {
  const { width } = useWindowDimensions();
  return <View style={styles.grid}>{React.Children.toArray(children).filter(Boolean).map((child, i) => (
    <View key={child.key || i} style={{ width: width >= 1000 ? '48.8%' : '100%', minWidth: 0 }}>{child}</View>
  ))}</View>;
}

export function Section({ title, note, resource, children, bare = false }) {
  return <View style={bare ? styles.bareSection : styles.section}>
    {!bare && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
    {note && <Note>{note}</Note>}
    {resource?.status === 'loading' ? (
      <View accessibilityLabel={`Loading ${title}`} accessibilityState={{ busy: true }} style={styles.skeletonWrap}>
        {[100, 75, 90].map((width) => <View key={width} style={[styles.skeleton, { width: `${width}%` }]} />)}
        <Note>Loading…</Note>
      </View>
    ) : resource?.status === 'error' ? (
      <View accessibilityLiveRegion="polite"><Text style={styles.error}>{resource.error}</Text><Action onPress={resource.reload}>Retry {title}</Action></View>
    ) : children}
  </View>;
}

export function Metrics({ items, colors }) {
  return <View style={styles.metrics}>{items.map(([label, value, suffix = '', note], index) => (
    <View key={label} style={[styles.metric, colors?.[index] && [styles.coloredMetric, { backgroundColor: colors[index] }]]}>
      {colors?.[index] ? <>
        <Text style={[styles.metricValue, styles.coloredMetricText]}>{displayNumber(value, suffix)}</Text>
        <Text style={[styles.metricLabel, styles.coloredMetricText]}>{label}</Text>
      </> : <>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{displayNumber(value, suffix)}</Text>
      </>}
      {note && <Note>{note}</Note>}
    </View>
  ))}</View>;
}

export function DataTable({ headers, rows, empty = 'No records for this selection.', onSelectRow, headerColor, cellStyle }) {
  if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row))) return <Empty>Not available: the response is missing these records.</Empty>;
  if (!rows.length) return <Empty>{empty}</Empty>;
  return <ScrollView horizontal accessibilityLabel="Scrollable data table" style={{ maxWidth: '100%' }}>
    <View style={{ minWidth: headers.length * 128 }}>
      <View style={styles.tableRow}>{headers.map((header) => <Text key={header} style={[styles.cell, styles.tableHeader, headerColor && { backgroundColor: headerColor, color: '#FFFFFF' }]}>{header}</Text>)}</View>
      {rows.map((row, i) => {
        const Row = onSelectRow ? Pressable : View;
        return <Row key={i} accessibilityRole={onSelectRow ? 'button' : undefined} onPress={onSelectRow ? () => onSelectRow(i) : undefined} style={styles.tableRow}>
          {row.map((cell, j) => <Text key={j} style={[styles.cell, cellStyle?.(i, j)]}>{typeof cell === 'string' || isNumber(cell) ? cell : 'Not available'}</Text>)}
        </Row>;
      })}
    </View>
  </ScrollView>;
}

// Every chart retains exact values as accessible text; colors are supplemental.
export function SeriesChart({ rows, valueKey, labelKey = 'label', unit = 'tasks', kind = 'bar', color, tableHeaderColor }) {
  const [width, setWidth] = useState(0);
  const [point, setPoint] = useState(null);
  if (!records(rows) || rows.some((row) => !isNumber(row[valueKey]) || typeof row[labelKey] !== 'string')) return <Empty>Not available: incomplete chart data.</Empty>;
  if (!rows.length) return <Empty>No recorded activity in this period.</Empty>;
  const data = { labels: rows.map((row) => row[labelKey]), datasets: [{ data: rows.map((row) => row[valueKey]) }] };
  const Chart = kind === 'line' ? LineChart : BarChart;
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <Note>{unit}. Scroll horizontally for all labels; select a data row for details.</Note>
    {width > 0 && <ScrollView horizontal>
      <Chart data={data} width={Math.max(width, rows.length * 90, 280)} height={220} chartConfig={color ? { ...baseChartConfig, color: (opacity = 1) => rgbaFromHex(color, opacity) } : baseChartConfig}
        fromZero yAxisLabel="" yAxisSuffix={unit === '%' ? '%' : ''} showValuesOnTopOfBars={kind === 'bar'}
        onDataPointClick={({ index, value }) => setPoint(`${rows[index][labelKey]}: ${displayNumber(value)} ${unit}`)} />
    </ScrollView>}
    {point && <Text accessibilityLiveRegion="polite" style={styles.note}>{point}</Text>}
    <DataTable headerColor={tableHeaderColor} headers={['Period / name', unit]} rows={rows.map((row) => [row[labelKey], displayNumber(row[valueKey])])}
      onSelectRow={(index) => setPoint(`${rows[index][labelKey]}: ${displayNumber(rows[index][valueKey])} ${unit}`)} />
  </View>;
}

export function Distribution({ rows }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(null);
  if (!records(rows) || rows.some((row) => !isNumber(row.count) || typeof row._id !== 'string')) return <Empty>Not available: incomplete distribution.</Empty>;
  if (!rows.length || rows.every((row) => row.count === 0)) return <Empty>No records (0) for this selection.</Empty>;
  const data = rows.map((row) => ({ id: row._id, name: DISTRIBUTION_LABELS[row._id] || row._id, count: row.count, color: DISTRIBUTION_COLORS[row._id] || Colors.primary, legendFontColor: Colors.black, legendFontSize: 12 }));
  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    {width > 0 && <PieChart data={data} width={width} height={180} chartConfig={baseChartConfig} accessor="count" backgroundColor="transparent" paddingLeft="0" hasLegend={false} center={[width / 4, 0]} absolute />}
    {data.map((row) => <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={`${row.name}: ${displayNumber(row.count)}`} onPress={() => setSelected(row.id)} style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: row.color }]} />
      <Text>{row.name}: {displayNumber(row.count)}</Text>
    </Pressable>)}
    {selected && data.some((row) => row.id === selected) && <Text accessibilityLiveRegion="polite" style={styles.note}>{data.find((row) => row.id === selected).name}: {displayNumber(data.find((row) => row.id === selected).count)} records</Text>}
  </View>;
}

export function Trend({ rows }) {
  return <>
    <Note>Completion rate = completed tasks / tasks with creation or completion activity in each bucket, as returned by the server. Empty periods are not invented.</Note>
    <SeriesChart rows={rows} valueKey="completionRate" unit="%" kind="line" />
    <Text style={styles.subtitle}>Completed tasks over time</Text>
    <SeriesChart rows={rows} valueKey="completedTasks" />
  </>;
}

export const dashboardStyles = StyleSheet.create({
  container: { padding: 16, gap: 16, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  heading: { color: Colors.black, fontSize: 24, fontWeight: '700' },
});

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  section: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.borderGray },
  bareSection: { gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.black },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 16, color: Colors.black },
  note: { color: Colors.black, opacity: 0.7, fontSize: 12, lineHeight: 18 },
  empty: { color: Colors.black, paddingVertical: 20, fontSize: 14, lineHeight: 22 },
  error: { color: '#B42318', lineHeight: 22, marginBottom: 8 },
  action: { backgroundColor: Colors.frame, borderRadius: 12, minHeight: 44, padding: 12, alignSelf: 'flex-start', justifyContent: 'center' },
  actionText: { color: Colors.button, fontWeight: '600', fontSize: 14 },
  skeletonWrap: { gap: 10 }, skeleton: { backgroundColor: Colors.secondary, height: 28, borderRadius: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, flexBasis: 145, backgroundColor: Colors.frame, borderRadius: 12, padding: 16, gap: 8 },
  metricLabel: { fontSize: 13, color: Colors.black }, metricValue: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  coloredMetric: { flexBasis: '45%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  coloredMetricText: { color: '#FFFFFF', textAlign: 'center' },
  tableRow: { flexDirection: 'row', minHeight: 44, borderBottomWidth: 1, borderColor: Colors.borderGray },
  cell: { width: 128, padding: 10, color: Colors.black, fontSize: 12 },
  tableHeader: { fontWeight: '700', backgroundColor: Colors.secondary },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});
