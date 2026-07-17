import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "../../../styles/color";

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
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noData: {
    textAlign: "center",
    color: Colors.black,
    opacity: 0.55,
    padding: 30,
    fontSize: 14,
  },
});

export default ChartContainer;
