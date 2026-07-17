import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Colors from "../../../styles/color";
import {
  baseChartConfig,
  LEAVE_TYPE_COLORS,
  rgbaFromHex,
  STATUS_COLORS,
} from "./chartConfig";
import ChartContainer from "./chartContainer";

const screenWidth = Dimensions.get("window").width;

const LegendItem = ({ color, label, value }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>
      {label}
      {typeof value === "number" ? `: ${value}` : ""}
    </Text>
  </View>
);

const AttendanceDailyChart = ({ data }) => {
  const { labels, present, late, absent, hasDaily, totals, monthYear } =
    useMemo(() => {
      const daily = Array.isArray(data?.daily) ? data.daily : [];
      const hasDaily = daily.length > 0;

      const now = new Date();
      const year = now.getFullYear();
      const monthIndex = now.getMonth(); // 0-11
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const monthYear = `${String(monthIndex + 1).padStart(2, "0")}/${year}`;

      const byDay = new Map(daily.map((d) => [d._id, d]));

      const labels = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return day === 1 || day % 5 === 0 ? String(day) : "";
      });

      const present = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return byDay.get(day)?.present || 0;
      });

      const late = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return byDay.get(day)?.late || 0;
      });

      const absent = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return byDay.get(day)?.absent || 0;
      });

      const totals = {
        present: present.reduce((a, b) => a + b, 0),
        late: late.reduce((a, b) => a + b, 0),
        absent: absent.reduce((a, b) => a + b, 0),
      };

      return { labels, present, late, absent, hasDaily, totals, monthYear };
    }, [data]);

  return (
    <ChartContainer noDataMessage="No attendance data for this month">
      {hasDaily && (
        <>
          <Text style={styles.caption}>Attendance Summary for {monthYear}</Text>

          <View style={styles.legendRow}>
            <LegendItem
              color={STATUS_COLORS.done}
              label="Present"
              value={totals.present}
            />
            <LegendItem
              color={STATUS_COLORS.todo}
              label="Late"
              value={totals.late}
            />
            <LegendItem
              color={LEAVE_TYPE_COLORS.sick}
              label="Absent"
              value={totals.absent}
            />
          </View>

          <LineChart
            data={{
              labels,
              datasets: [
                {
                  data: present,
                  color: (opacity = 1) =>
                    rgbaFromHex(STATUS_COLORS.done, opacity),
                  strokeWidth: 2,
                },
                {
                  data: late,
                  color: (opacity = 1) =>
                    rgbaFromHex(STATUS_COLORS.todo, opacity),
                  strokeWidth: 2,
                },
                {
                  data: absent,
                  color: (opacity = 1) =>
                    rgbaFromHex(LEAVE_TYPE_COLORS.sick, opacity),
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={baseChartConfig}
            fromZero
            withDots={false}
            withInnerLines
            segments={4}
            formatYLabel={(v) => String(Math.round(Number(v)))}
            style={styles.chart}
          />
        </>
      )}
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  caption: {
    width: "100%",
    color: Colors.black,
    opacity: 0.65,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginTop: 8,
  },
  legendRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  legendText: {
    fontSize: 12,
    color: Colors.black,
    opacity: 0.85,
    fontWeight: "600",
  },
});

export default AttendanceDailyChart;
