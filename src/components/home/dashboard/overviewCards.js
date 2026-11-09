import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../../styles/color";
import { rgbaFromHex } from "./chartConfig";

const OverviewCard = ({ value, label, backgroundColor }) => (
  <View
    style={[
      styles.overviewCard,
      {
        backgroundColor: rgbaFromHex(backgroundColor, 0.1),
        borderColor: rgbaFromHex(backgroundColor, 0.25),
      },
    ]}
  >
    <View style={styles.topRow}>
      <View
        style={[
          styles.dotRing,
          {
            borderColor: backgroundColor,
            backgroundColor: rgbaFromHex(backgroundColor, 0.16),
          },
        ]}
      >
        <View style={[styles.dotInner, { backgroundColor }]} />
      </View>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
    <Text style={[styles.overviewNumber, { color: backgroundColor }]}>{value}</Text>
  </View>
);

const OverviewCards = ({ data }) => {
  const cards = [
    { value: data?.totalEmployees || 0, label: "Employees", color: "#2563EB" },
    { value: data?.totalTeams || 0, label: "Teams", color: "#10B981" },
    { value: data?.totalTasks || 0, label: "Tasks", color: Colors.primary },
    {
      value: data?.pendingLeaves || 0,
      label: "Pending Leaves",
      color: "#F59E0B",
    },
  ];

  return (
    <View style={styles.overviewContainer}>
      {cards.map((card, index) => (
        <OverviewCard
          key={index}
          value={card.value}
          label={card.label}
          backgroundColor={card.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  overviewCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dotRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#344054",
  },
});

export default OverviewCards;
