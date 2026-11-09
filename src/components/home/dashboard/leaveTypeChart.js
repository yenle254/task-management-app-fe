import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import ChartContainer from "./chartContainer";
import {
  baseChartConfig,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_LABELS,
  rgbaFromHex,
} from "./chartConfig";

const LeaveTypeChart = ({ data }) => {
  const chartData =
    data?.byType?.map((item) => ({
      id: item._id,
      name: LEAVE_TYPE_LABELS[item._id] || item._id,
      count: item.count,
      color: LEAVE_TYPE_COLORS[item._id] || "#6B7280",
      legendFontColor: "#344054",
      legendFontSize: 12,
    })) || [];

  const total = chartData.reduce((sum, item) => sum + (item.count || 0), 0);
  const topItem =
    chartData.length > 0
      ? chartData.reduce((best, item) => (item.count > best.count ? item : best), chartData[0])
      : null;
  const topPct = total > 0 && topItem ? Math.round((topItem.count / total) * 100) : 0;

  return (
    <ChartContainer>
      {chartData.length > 0 && (
        <View style={styles.wrapper}>
          <View style={styles.donutBox}>
            <PieChart
              data={chartData}
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
              <Text style={styles.donutValue}>{`${topPct}%`}</Text>
              <Text style={styles.donutLabel} numberOfLines={1}>
                {topItem?.name || "Total"}
              </Text>
            </View>
          </View>
          <View style={styles.legendGrid}>
            {chartData.map((item) => (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {item.name}: {item.count}
                </Text>
                <View style={[styles.pctBadge, { backgroundColor: rgbaFromHex(item.color, 0.14) }]}>
                  <Text style={[styles.pctText, { color: item.color }]}>
                    {total > 0 ? `${Math.round((item.count / total) * 100)}%` : "0%"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  donutBox: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutHole: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  donutValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#101828",
  },
  donutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#667085",
    marginTop: 2,
  },
  legendGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  legendItem: {
    flexGrow: 1,
    flexBasis: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#344054",
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pctText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

export default LeaveTypeChart;
