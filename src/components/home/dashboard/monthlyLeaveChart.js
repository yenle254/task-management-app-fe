import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import ChartContainer from "./chartContainer";
import { baseChartConfig, MONTH_LABELS } from "./chartConfig";

const screenWidth = Dimensions.get("window").width;

const MonthlyLeaveChart = ({ data }) => {
  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        data: Array.from({ length: 12 }, (_, i) => {
          const monthData = data?.byMonth?.find((m) => m._id === i + 1);
          return monthData?.count || 0;
        }),
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ChartContainer>
      <LineChart
        data={chartData}
        width={screenWidth - 48}
        height={200}
        chartConfig={{
          ...baseChartConfig,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        }}
        bezier
        fromZero
        style={styles.chart}
      />
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
  },
});

export default MonthlyLeaveChart;
