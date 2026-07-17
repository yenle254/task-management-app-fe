import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { BarChart } from "react-native-chart-kit";
import ChartContainer from "./chartContainer";
import { baseChartConfig } from "./chartConfig";

const screenWidth = Dimensions.get("window").width;

const TeamPerformanceChart = ({ data }) => {
  const chartData = {
    labels: data
      .slice(0, 4)
      .map((t) =>
        t.teamName.length > 8 ? t.teamName.substring(0, 8) + ".." : t.teamName
      ),
    datasets: [
      {
        data:
          data.length > 0
            ? data.slice(0, 4).map((t) => t.completionRate || 0)
            : [0],
      },
    ],
  };

  return (
    <ChartContainer>
      {data.length > 0 && (
        <BarChart
          data={chartData}
          width={screenWidth - 48}
          height={200}
          chartConfig={{
            ...baseChartConfig,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          }}
          verticalLabelRotation={0}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      )}
    </ChartContainer>
  );
};

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
  },
});

export default TeamPerformanceChart;
