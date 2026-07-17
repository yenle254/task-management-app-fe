import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../../styles/color";

const OverviewCard = ({ value, label, backgroundColor }) => (
  <View style={[styles.overviewCard, { backgroundColor }]}>
    <Text style={styles.overviewNumber}>{value}</Text>
    <Text style={styles.overviewLabel}>{label}</Text>
  </View>
);

const OverviewCards = ({ data }) => {
  const cards = [
    { value: data?.totalEmployees || 0, label: "Employees", color: "#3B82F6" },
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
  },
  overviewCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  overviewLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    marginTop: 4,
    opacity: 0.9,
  },
});

export default OverviewCards;
