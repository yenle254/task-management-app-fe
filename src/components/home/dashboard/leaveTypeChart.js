import React from "react";
import { Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import ChartContainer from "./chartContainer";
import {
  baseChartConfig,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_LABELS,
} from "./chartConfig";

const screenWidth = Dimensions.get("window").width;

const LeaveTypeChart = ({ data }) => {
  const chartData =
    data?.byType?.map((item) => ({
      name: LEAVE_TYPE_LABELS[item._id] || item._id,
      count: item.count,
      color: LEAVE_TYPE_COLORS[item._id] || "#6B7280",
      legendFontColor: "#333",
      legendFontSize: 11,
    })) || [];

  return (
    <ChartContainer>
      {chartData.length > 0 && (
        <PieChart
          data={chartData}
          width={screenWidth - 48}
          height={180}
          chartConfig={baseChartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="10"
          absolute
        />
      )}
    </ChartContainer>
  );
};

export default LeaveTypeChart;
