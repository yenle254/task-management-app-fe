import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ChartContainer = ({ children, noDataMessage = "No data available" }) => {
  const hasData = React.Children.count(children) > 0;

  return (
    <View style={styles.chartContainer}>
      {hasData ? children : <Text style={styles.noData}>{noDataMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noData: {
    textAlign: "center",
    color: "#667085",
    padding: 30,
    fontSize: 14,
  },
});

export default ChartContainer;
