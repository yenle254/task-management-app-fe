import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import Colors from '../../../styles/color';
import { displayNumber, isNumber, records } from '../../../utils/dashboardData';
import {
  baseChartConfig,
  DISTRIBUTION_COLORS,
  DISTRIBUTION_LABELS,
  METRIC_CARD_THEMES,
  rgbaFromHex,
} from './chartConfig';

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
  return <View style={styles.metrics}>{items.map(([label, value, suffix = '', note], index) => {
    const theme = METRIC_CARD_THEMES[index % METRIC_CARD_THEMES.length];
    const customColor = colors?.[index];
    const accentColor = customColor || theme.accent;
    const cardBg = customColor ? rgbaFromHex(customColor, 0.1) : theme.bg;
    const cardBorder = customColor ? rgbaFromHex(customColor, 0.25) : theme.border;
    return (
      <View
        key={label}
        style={[
          styles.metric,
          { backgroundColor: cardBg, borderColor: cardBorder },
          customColor && styles.coloredMetric,
        ]}
      >
        <View style={styles.metricTopRow}>
          <View style={[styles.metricRing, { borderColor: accentColor, backgroundColor: rgbaFromHex(accentColor, 0.16) }]}>
            <View style={[styles.metricRingInner, { backgroundColor: accentColor }]} />
          </View>
          <Text style={styles.metricLabel} numberOfLines={2}>{label}</Text>
        </View>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, { color: customColor || '#101828' }]}>{displayNumber(value, suffix)}</Text>
          {suffix ? (
            <View style={[styles.metricPill, { backgroundColor: rgbaFromHex(accentColor, 0.14) }]}>
              <Text style={[styles.metricPillText, { color: accentColor }]}>{suffix.trim()}</Text>
            </View>
          ) : null}
        </View>
        {note && <Note>{note}</Note>}
      </View>
    );
  })}</View>;
}

const TABLE_COLUMN_WEIGHTS = {
  1: [100],
  2: [58, 42],
  3: [44, 30, 26],
  4: [34, 22, 22, 22],
  5: [34, 15, 19, 15, 17],
};

export function DataTable({ headers, rows, empty = 'No records for this selection.', onSelectRow, headerColor, cellStyle }) {
  const [containerWidth, setContainerWidth] = useState(0);
  if (!Array.isArray(rows) || rows.some((row) => !Array.isArray(row))) return <Empty>Not available: the response is missing these records.</Empty>;
  if (!rows.length) return <Empty>{empty}</Empty>;

  const colCount = headers.length;
  const weights = TABLE_COLUMN_WEIGHTS[colCount];
  const minTableWidth = colCount <= 2 ? 260 : colCount === 3 ? 300 : colCount === 4 ? 320 : colCount === 5 ? 360 : colCount * 108;
  const effectiveWidth = Math.max(containerWidth, minTableWidth);

  const getColumnWidthStyle = (colIndex) => {
    if (weights) {
      if (containerWidth > 0) {
        const px = Math.floor((effectiveWidth * weights[colIndex]) / 100);
        return { width: px, minWidth: px, maxWidth: px };
      }
      const pct = `${weights[colIndex]}%`;
      return { width: pct, minWidth: pct, maxWidth: pct };
    }
    const firstColPx = 148;
    const otherColPx = Math.max(96, Math.floor((effectiveWidth - firstColPx) / Math.max(1, colCount - 1)));
    const px = colIndex === 0 ? firstColPx : otherColPx;
    return { width: px, minWidth: px, maxWidth: px };
  };

  return (
    <View style={styles.tableWrapper} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        accessibilityLabel="Scrollable data table"
        showsHorizontalScrollIndicator={colCount > 5 || (containerWidth > 0 && containerWidth < minTableWidth)}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={[styles.tableInner, containerWidth > 0 ? { width: effectiveWidth, minWidth: effectiveWidth } : { width: '100%' }]}>
          <View style={[styles.tableRow, styles.tableHeaderRow, headerColor && { backgroundColor: headerColor }]}>
            {headers.map((header, idx) => (
              <View
                key={header}
                style={[
                  styles.cellBox,
                  getColumnWidthStyle(idx),
                  idx > 0 && styles.numericCellBox,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cellText,
                    idx === 0 ? styles.firstCellHeader : styles.numericCell,
                    styles.tableHeader,
                    headerColor && { color: '#FFFFFF' },
                  ]}
                >
                  {header}
                </Text>
              </View>
            ))}
          </View>
          {rows.map((row, i) => {
            const Row = onSelectRow ? Pressable : View;
            return (
              <Row
                key={i}
                accessibilityRole={onSelectRow ? 'button' : undefined}
                onPress={onSelectRow ? () => onSelectRow(i) : undefined}
                style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt, i === rows.length - 1 && styles.tableRowLast]}
              >
                {row.map((cell, j) => (
                  <View
                    key={j}
                    style={[
                      styles.cellBox,
                      getColumnWidthStyle(j),
                      j > 0 && styles.numericCellBox,
                    ]}
                  >
                    <Text
                      numberOfLines={j === 0 ? 2 : 1}
                      style={[
                        styles.cellText,
                        j === 0 ? styles.firstCell : styles.numericCell,
                        cellStyle?.(i, j),
                      ]}
                    >
                      {typeof cell === 'string' || isNumber(cell) ? cell : 'Not available'}
                    </Text>
                  </View>
                ))}
              </Row>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// Every chart retains exact values as accessible text; colors are supplemental.
export function SeriesChart({
  rows,
  valueKey,
  labelKey = 'label',
  unit = 'tasks',
  kind = 'bar',
  color,
}) {
  const [width, setWidth] = useState(0);
  const [point, setPoint] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!records(rows) || rows.some((row) => !isNumber(row[valueKey]) || typeof row[labelKey] !== 'string')) return <Empty>Not available: incomplete chart data.</Empty>;
  if (!rows.length) return <Empty>No recorded activity in this period.</Empty>;

  const activeColor = color || Colors.primary;
  const values = rows.map((row) => row[valueKey]);
  const maxVal = Math.max(...values, 1);
  const totalVal = Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
  const data = {
    labels: rows.map((row) => (row[labelKey].length > 10 ? `${row[labelKey].slice(0, 9)}…` : row[labelKey])),
    datasets: [{
      data: values,
      color: (opacity = 1) => rgbaFromHex(activeColor, opacity),
      strokeWidth: 2.5,
    }],
  };
  const Chart = kind === 'line' ? LineChart : BarChart;
  const customChartConfig = {
    ...baseChartConfig,
    color: (opacity = 1) => rgbaFromHex(activeColor, opacity),
    fillShadowGradientFrom: activeColor,
    fillShadowGradientFromOpacity: kind === 'line' ? 0.25 : 0.85,
    fillShadowGradientTo: kind === 'line' ? '#FFFFFF' : activeColor,
    fillShadowGradientToOpacity: kind === 'line' ? 0.02 : 0.85,
    propsForDots: {
      ...baseChartConfig.propsForDots,
      stroke: activeColor,
    },
  };

  const selectRow = (index, val = rows[index]?.[valueKey]) => {
    if (!rows[index]) return;
    setSelectedIndex(index);
    setPoint(`${rows[index][labelKey]}: ${displayNumber(val)} ${unit}`);
  };

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.chartCardInner}>
    <View style={styles.chartMetaRow}>
      <View style={[styles.unitBadge, { backgroundColor: rgbaFromHex(activeColor, 0.12) }]}>
        <View style={[styles.unitDot, { backgroundColor: activeColor }]} />
        <Text style={[styles.unitBadgeText, { color: activeColor }]}>{unit}</Text>
      </View>
      <Text style={styles.chartSummaryText}>
        {unit === '%' ? `Peak: ${displayNumber(Math.max(...values), '%')}` : `Total: ${displayNumber(totalVal)} ${unit}`}
      </Text>
    </View>
    {width > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
      <Chart
        data={data}
        width={Math.max(width - 8, rows.length * 76, 280)}
        height={220}
        chartConfig={customChartConfig}
        bezier={kind === 'line'}
        fromZero
        segments={4}
        withInnerLines
        withVerticalLines={false}
        yAxisLabel=""
        yAxisSuffix={unit === '%' ? '%' : ''}
        showValuesOnTopOfBars={kind === 'bar'}
        style={styles.chartCanvas}
        onDataPointClick={({ index, value }) => selectRow(index, value)}
      />
    </ScrollView>}
    {point && (
      <View style={[styles.tooltipCard, { borderLeftColor: activeColor }]}>
        <View style={[styles.tooltipDot, { backgroundColor: activeColor }]} />
        <Text accessibilityLiveRegion="polite" style={styles.tooltipText}>{point}</Text>
      </View>
    )}
    {kind === 'bar' && rows.length <= 12 && (
      <View style={styles.horizontalBarsWrap}>
        {rows.map((row, idx) => {
          const val = row[valueKey];
          const pct = Math.max(6, Math.min(100, Math.round((val / maxVal) * 100)));
          const isSelected = selectedIndex === idx || (selectedIndex === null && val === maxVal && val > 0);
          return (
            <Pressable key={`${row[labelKey]}-${idx}`} onPress={() => selectRow(idx)} style={styles.hBarRow}>
              <Text style={styles.hBarLabel} numberOfLines={1}>{row[labelKey]}</Text>
              <View style={styles.hBarTrack}>
                <View
                  style={[
                    styles.hBarFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: isSelected ? activeColor : rgbaFromHex(activeColor, 0.35),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.hBarValue, isSelected && { color: activeColor, fontWeight: '700' }]}>
                {displayNumber(val, unit === '%' ? '%' : '')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    )}
  </View>;
}

export function Distribution({ rows }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(null);
  if (!records(rows) || rows.some((row) => !isNumber(row.count) || typeof row._id !== 'string')) return <Empty>Not available: incomplete distribution.</Empty>;
  if (!rows.length || rows.every((row) => row.count === 0)) return <Empty>No records (0) for this selection.</Empty>;
  const data = rows.map((row) => ({
    id: row._id,
    name: DISTRIBUTION_LABELS[row._id] || row._id,
    count: row.count,
    color: DISTRIBUTION_COLORS[row._id] || Colors.primary,
    legendFontColor: Colors.black,
    legendFontSize: 12,
  }));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const activeItem = data.find((item) => item.id === selected) || data.reduce((best, item) => (item.count > best.count ? item : best), data[0]);
  const activeShare = total > 0 ? Math.round((activeItem.count / total) * 100) : 0;

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.distributionContainer}>
    {width > 0 && (
      <View style={styles.donutWrapper}>
        <View style={styles.donutChartBox}>
          <PieChart
            data={data}
            width={200}
            height={200}
            chartConfig={baseChartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="50"
            hasLegend={false}
            center={[0, 0]}
            absolute
          />
          <View pointerEvents="none" style={styles.donutHole}>
            <Text style={styles.donutCenterValue}>{`${activeShare}%`}</Text>
            <Text style={styles.donutCenterLabel} numberOfLines={1}>{activeItem.name}</Text>
            <Text style={styles.donutCenterSub}>{`${displayNumber(activeItem.count)} / ${displayNumber(total)}`}</Text>
          </View>
        </View>
      </View>
    )}
    <View style={styles.segmentedBar}>
      {data.filter((item) => item.count > 0).map((item) => (
        <View
          key={`seg-${item.id}`}
          style={[
            styles.segmentItem,
            {
              flex: Math.max(item.count, 0.5),
              backgroundColor: item.color,
              opacity: !selected || selected === item.id ? 1 : 0.45,
            },
          ]}
        />
      ))}
    </View>
    <View style={styles.legendGrid}>
      {data.map((row) => {
        const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
        const isSelected = selected === row.id;
        return (
          <Pressable
            key={row.id}
            accessibilityRole="button"
            accessibilityLabel={`${row.name}: ${displayNumber(row.count)}`}
            onPress={() => setSelected(row.id)}
            style={[styles.legend, isSelected && { borderColor: row.color, backgroundColor: rgbaFromHex(row.color, 0.08) }]}
          >
            <View style={[styles.legendDot, { backgroundColor: row.color }]} />
            <Text style={styles.legendText} numberOfLines={1}>{row.name}: {displayNumber(row.count)}</Text>
            <View style={[styles.legendPctPill, { backgroundColor: rgbaFromHex(row.color, 0.14) }]}>
              <Text style={[styles.legendPctText, { color: row.color }]}>{`${share}%`}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
    {selected && data.some((row) => row.id === selected) && (
      <View style={[styles.tooltipCard, { borderLeftColor: activeItem.color }]}>
        <View style={[styles.tooltipDot, { backgroundColor: activeItem.color }]} />
        <Text accessibilityLiveRegion="polite" style={styles.tooltipText}>
          {data.find((row) => row.id === selected).name}: {displayNumber(data.find((row) => row.id === selected).count)} records
        </Text>
      </View>
    )}
  </View>;
}

export function AttendanceMultiSeriesChart({ rows }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!records(rows) || rows.some((row) => typeof row.date !== 'string' || !row.date || !isNumber(row.present) || !isNumber(row.late) || !isNumber(row.absent))) {
    return <Empty>Not available: incomplete chart data.</Empty>;
  }
  if (!rows.length || rows.every((row) => row.present === 0 && row.late === 0 && row.absent === 0)) {
    return <Empty>No records (0) for this selection.</Empty>;
  }
  const maxVal = Math.max(...rows.map((r) => Math.max(r.present, r.late, r.absent)), 1);
  const activeIdx = selectedIndex !== null && rows[selectedIndex] ? selectedIndex : 0;
  const activeRow = rows[activeIdx];

  return (
    <View style={styles.multiSeriesBox}>
      <View style={styles.multiLegendRow}>
        {[
          ['Present', DISTRIBUTION_COLORS.present],
          ['Late', DISTRIBUTION_COLORS.late],
          ['Absent', DISTRIBUTION_COLORS.absent],
        ].map(([name, color]) => (
          <View key={name} style={styles.multiLegendItem}>
            <View style={[styles.multiLegendDot, { backgroundColor: color }]} />
            <Text style={styles.multiLegendText}>{name}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.multiColumnsScroll}>
        {rows.map((row, idx) => {
          const isSelected = activeIdx === idx;
          const pHeight = Math.max(row.present > 0 ? 10 : 3, Math.round((row.present / maxVal) * 120));
          const lHeight = Math.max(row.late > 0 ? 10 : 3, Math.round((row.late / maxVal) * 120));
          const aHeight = Math.max(row.absent > 0 ? 10 : 3, Math.round((row.absent / maxVal) * 120));
          return (
            <Pressable
              key={row.date}
              accessibilityRole="button"
              accessibilityLabel={`${row.date}: Present ${row.present}, Late ${row.late}, Absent ${row.absent}`}
              onPress={() => setSelectedIndex(idx)}
              style={[styles.multiColGroup, isSelected && styles.multiColGroupActive]}
            >
              <View style={styles.multiBarsWrap}>
                <View style={[styles.multiBar, { height: pHeight, backgroundColor: DISTRIBUTION_COLORS.present }]} />
                <View style={[styles.multiBar, { height: lHeight, backgroundColor: DISTRIBUTION_COLORS.late }]} />
                <View style={[styles.multiBar, { height: aHeight, backgroundColor: DISTRIBUTION_COLORS.absent }]} />
              </View>
              <Text style={[styles.multiColLabel, isSelected && styles.multiColLabelActive]} numberOfLines={1}>
                {row.date.length >= 10 ? row.date.slice(5) : row.date}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeRow && (
        <View style={[styles.tooltipCard, { borderLeftColor: DISTRIBUTION_COLORS.present }]}>
          <View style={[styles.tooltipDot, { backgroundColor: DISTRIBUTION_COLORS.present }]} />
          <Text accessibilityLiveRegion="polite" style={styles.tooltipText}>
            {`${activeRow.date} — Present: ${displayNumber(activeRow.present)} · Late: ${displayNumber(activeRow.late)} · Absent: ${displayNumber(activeRow.absent)}`}
          </Text>
        </View>
      )}
    </View>
  );
}

export function CreatedVsCompletedChart({ rows }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!records(rows) || rows.some((row) => !isNumber(row.createdTasks) || !isNumber(row.completedTasks) || typeof (row.label ?? row.period) !== 'string')) {
    return <Empty>Not available: incomplete chart data.</Empty>;
  }
  if (!rows.length || rows.every((row) => row.createdTasks === 0 && row.completedTasks === 0)) {
    return <Empty>No records (0) for this selection.</Empty>;
  }
  const maxVal = Math.max(...rows.map((r) => Math.max(r.createdTasks, r.completedTasks)), 1);
  const activeIdx = selectedIndex !== null && rows[selectedIndex] ? selectedIndex : rows.length - 1;
  const activeRow = rows[activeIdx];

  return (
    <View style={styles.multiSeriesBox}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dualColumnsScroll}>
        {rows.map((row, idx) => {
          const label = row.label ?? row.period;
          const isSelected = activeIdx === idx;
          const createdH = Math.max(row.createdTasks > 0 ? 14 : 4, Math.round((row.createdTasks / maxVal) * 130));
          const completedH = Math.max(row.completedTasks > 0 ? 14 : 4, Math.round((row.completedTasks / maxVal) * 130));
          return (
            <Pressable
              key={`${label}-${idx}`}
              accessibilityRole="button"
              accessibilityLabel={`${label}: Created ${row.createdTasks}, Completed ${row.completedTasks}`}
              onPress={() => setSelectedIndex(idx)}
              style={[styles.dualColItem, isSelected && styles.multiColGroupActive]}
            >
              <View style={styles.dualBarTrack}>
                <View style={[styles.dualBarCreated, { height: createdH }]} />
                <View style={[styles.dualBarCompleted, { height: completedH }]} />
              </View>
              <Text style={[styles.multiColLabel, isSelected && styles.multiColLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.multiLegendRow, { justifyContent: 'center' }]}>
        <View style={styles.multiLegendItem}>
          <View style={[styles.multiLegendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.multiLegendText}>Completed</Text>
        </View>
        <View style={styles.multiLegendItem}>
          <View style={[styles.multiLegendDot, { backgroundColor: '#C4B5FD' }]} />
          <Text style={styles.multiLegendText}>Created</Text>
        </View>
      </View>

      {activeRow && (
        <View style={[styles.tooltipCard, { borderLeftColor: Colors.primary }]}>
          <View style={[styles.tooltipDot, { backgroundColor: Colors.primary }]} />
          <Text accessibilityLiveRegion="polite" style={styles.tooltipText}>
            {`${activeRow.label ?? activeRow.period}: Completed ${displayNumber(activeRow.completedTasks)} · Created ${displayNumber(activeRow.createdTasks)}`}
          </Text>
        </View>
      )}
    </View>
  );
}

export function EstimatedVsActualChart({ rows, labelKey = 'label' }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!records(rows) || rows.some((row) => typeof row[labelKey] !== 'string' || !row[labelKey] || !isNumber(row.estimatedHours) || !isNumber(row.actualHours))) {
    return <Empty>Not available: incomplete chart data.</Empty>;
  }
  const activeRows = rows.filter((row) => row.estimatedHours > 0 || row.actualHours > 0);
  if (!activeRows.length) {
    return <Empty>No recorded estimated or actual hours (0 h) for this selection.</Empty>;
  }
  const totalEst = Math.round(activeRows.reduce((sum, r) => sum + r.estimatedHours, 0) * 100) / 100;
  const totalAct = Math.round(activeRows.reduce((sum, r) => sum + r.actualHours, 0) * 100) / 100;
  const variance = Math.round((totalAct - totalEst) * 100) / 100;
  const maxVal = Math.max(...activeRows.map((r) => Math.max(r.estimatedHours, r.actualHours)), 1);

  return (
    <View style={styles.multiSeriesBox}>
      <View style={styles.estSummaryRow}>
        <View style={[styles.estSummaryBadge, { backgroundColor: '#EFF4FF', borderColor: '#DBEAFE' }]}>
          <Text style={[styles.estSummaryLabel, { color: '#1D4ED8' }]}>Estimated</Text>
          <Text style={[styles.estSummaryValue, { color: '#1E3A8A' }]}>{displayNumber(totalEst, ' h')}</Text>
        </View>
        <View style={[styles.estSummaryBadge, { backgroundColor: '#F4F3FF', borderColor: '#E9D7FE' }]}>
          <Text style={[styles.estSummaryLabel, { color: '#6938EF' }]}>Actual</Text>
          <Text style={[styles.estSummaryValue, { color: '#4A1FB8' }]}>{displayNumber(totalAct, ' h')}</Text>
        </View>
        <View
          style={[
            styles.estSummaryBadge,
            variance > 0
              ? { backgroundColor: '#FEF3F2', borderColor: '#FEE4E2' }
              : { backgroundColor: '#ECFDF3', borderColor: '#D1FADF' },
          ]}
        >
          <Text style={[styles.estSummaryLabel, { color: variance > 0 ? '#B42318' : '#027A48' }]}>Variance</Text>
          <Text style={[styles.estSummaryValue, { color: variance > 0 ? '#912018' : '#065F46' }]}>
            {`${variance > 0 ? '+' : ''}${displayNumber(variance, ' h')}`}
          </Text>
        </View>
      </View>

      <View style={styles.multiLegendRow}>
        <View style={styles.multiLegendItem}>
          <View style={[styles.multiLegendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.multiLegendText}>Estimated (h)</Text>
        </View>
        <View style={styles.multiLegendItem}>
          <View style={[styles.multiLegendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.multiLegendText}>Actual within budget (h)</Text>
        </View>
        <View style={styles.multiLegendItem}>
          <View style={[styles.multiLegendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.multiLegendText}>Over-budget (h)</Text>
        </View>
      </View>

      <View style={styles.horizontalBarsWrap}>
        {activeRows.map((row, idx) => {
          const estPct = Math.max(row.estimatedHours > 0 ? 6 : 2, Math.min(100, Math.round((row.estimatedHours / maxVal) * 100)));
          const actPct = Math.max(row.actualHours > 0 ? 6 : 2, Math.min(100, Math.round((row.actualHours / maxVal) * 100)));
          const overBudget = row.estimatedHours > 0 && row.actualHours > row.estimatedHours;
          const actColor = overBudget ? '#EF4444' : Colors.primary;
          const isSelected = selectedIndex === idx;
          return (
            <Pressable
              key={`${row[labelKey]}-${idx}`}
              onPress={() => setSelectedIndex(idx)}
              style={[styles.estRowCard, isSelected && { borderColor: actColor, backgroundColor: '#F9FAFB' }]}
            >
              <View style={styles.estRowHeader}>
                <Text style={styles.estRowTitle} numberOfLines={1}>{row[labelKey]}</Text>
                <Text style={[styles.estRowMeta, overBudget && { color: '#B42318', fontWeight: '700' }]}>
                  {`Est: ${displayNumber(row.estimatedHours, 'h')} · Act: ${displayNumber(row.actualHours, 'h')}`}
                </Text>
              </View>
              <View style={styles.estDualBars}>
                <View style={styles.hBarTrack}>
                  <View style={[styles.hBarFill, { width: `${estPct}%`, backgroundColor: '#3B82F6' }]} />
                </View>
                <View style={styles.hBarTrack}>
                  <View style={[styles.hBarFill, { width: `${actPct}%`, backgroundColor: actColor }]} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Trend({ rows }) {
  return <>
    <Note>Completion rate = completed tasks / tasks with creation or completion activity in each bucket, as returned by the server. Empty periods are not invented.</Note>
    <SeriesChart rows={rows} valueKey="completionRate" unit="%" kind="line" color="#2563EB" />
    <Text style={styles.subtitle}>Created vs Completed tasks</Text>
    <CreatedVsCompletedChart rows={rows} />
    <Text style={styles.subtitle}>Completed tasks over time</Text>
    <SeriesChart rows={rows} valueKey="completedTasks" color={Colors.primary} />
  </>;
}

export const dashboardStyles = StyleSheet.create({
  container: { padding: 16, gap: 16, width: '100%', maxWidth: 1440, alignSelf: 'center' },
  heading: { color: Colors.black, fontSize: 24, fontWeight: '700' },
});

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bareSection: { gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#101828', letterSpacing: -0.2 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 16, color: '#101828' },
  note: { color: '#667085', fontSize: 12, lineHeight: 18 },
  empty: { color: '#667085', paddingVertical: 20, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  error: { color: '#B42318', lineHeight: 22, marginBottom: 8 },
  action: { backgroundColor: Colors.frame, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start', justifyContent: 'center', borderWidth: 1, borderColor: '#E9D7FE' },
  actionText: { color: Colors.button, fontWeight: '600', fontSize: 14 },
  skeletonWrap: { gap: 10 },
  skeleton: { backgroundColor: '#F2F4F7', height: 28, borderRadius: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: {
    flexGrow: 1,
    flexBasis: 155,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  coloredMetric: {
    flexBasis: '45%',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRingInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  metricLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#344054' },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  metricValue: { fontSize: 28, fontWeight: '800', color: '#101828', letterSpacing: -0.5 },
  metricPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartCardInner: {
    gap: 10,
  },
  chartMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  unitDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chartSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  chartScroll: {
    borderRadius: 12,
  },
  chartCanvas: {
    borderRadius: 12,
    marginVertical: 4,
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipText: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalBarsWrap: {
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 32,
  },
  hBarLabel: {
    width: 96,
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
  },
  hBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F2F4F7',
    borderRadius: 999,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  hBarValue: {
    minWidth: 38,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: '#344054',
  },
  distributionContainer: {
    gap: 14,
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  donutChartBox: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutHole: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  donutCenterValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.5,
  },
  donutCenterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667085',
    marginTop: 1,
  },
  donutCenterSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#98A2B3',
    marginTop: 1,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 3,
    backgroundColor: '#F2F4F7',
  },
  segmentItem: {
    height: '100%',
    borderRadius: 999,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  legend: {
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#344054' },
  legendPctPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  legendPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableWrapper: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  tableInner: {
    flex: 1,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    minHeight: 44,
    borderBottomWidth: 1,
    borderColor: '#F2F4F7',
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeaderRow: {
    backgroundColor: '#F9FAFB',
    borderBottomColor: '#EAECF0',
  },
  tableRowAlt: {
    backgroundColor: '#FCFCFD',
  },
  cellBox: {
    paddingHorizontal: 10,
    paddingVertical: 11,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  numericCellBox: {
    alignItems: 'center',
  },
  cellText: { color: '#344054', fontSize: 12 },
  firstCellHeader: { textAlign: 'left' },
  firstCell: { fontWeight: '600', color: '#101828', textAlign: 'left' },
  numericCell: { textAlign: 'center', width: '100%' },
  tableHeader: { fontWeight: '700', color: '#475467', fontSize: 12 },
  multiSeriesBox: {
    gap: 12,
    paddingTop: 4,
  },
  multiLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  multiLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  multiLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  multiColumnsScroll: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    alignItems: 'flex-end',
  },
  multiColGroup: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  multiColGroupActive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#EAECF0',
  },
  multiBarsWrap: {
    height: 126,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  multiBar: {
    width: 10,
    borderRadius: 5,
  },
  multiColLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667085',
  },
  multiColLabelActive: {
    color: '#101828',
    fontWeight: '700',
  },
  dualColumnsScroll: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 16,
    alignItems: 'flex-end',
  },
  dualColItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  dualBarTrack: {
    width: 24,
    height: 136,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  dualBarCreated: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    borderRadius: 8,
    backgroundColor: '#DDD6FE',
  },
  dualBarCompleted: {
    width: 20,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  estSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  estSummaryBadge: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  estSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  estSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  estRowCard: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F2F4F7',
    gap: 6,
  },
  estRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  estRowTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#101828',
  },
  estRowMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
  },
  estDualBars: {
    gap: 5,
  },
});
