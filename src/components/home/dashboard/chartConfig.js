import Colors from "../../../styles/color";

export const rgbaFromHex = (hex, opacity = 1) => {
  if (!hex || typeof hex !== "string") {
    return `rgba(0, 0, 0, ${opacity})`;
  }

  const normalized = hex.replace("#", "").trim();
  const six = normalized.length >= 6 ? normalized.substring(0, 6) : "000000";
  const r = parseInt(six.substring(0, 2), 16);
  const g = parseInt(six.substring(2, 4), 16);
  const b = parseInt(six.substring(4, 6), 16);

  return `rgba(${Number.isFinite(r) ? r : 0}, ${Number.isFinite(g) ? g : 0}, ${
    Number.isFinite(b) ? b : 0
  }, ${opacity})`;
};

export const baseChartConfig = {
  backgroundColor: Colors.white,
  backgroundGradientFrom: Colors.white,
  backgroundGradientTo: Colors.white,
  decimalPlaces: 0,
  color: (opacity = 1) => rgbaFromHex(Colors.primary, opacity),
  labelColor: (opacity = 1) => rgbaFromHex(Colors.black, opacity),
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: Colors.primary,
  },
  propsForBackgroundLines: {
    stroke: rgbaFromHex(Colors.black, 0.08),
  },
  propsForLabels: {
    fontSize: 10,
  },
};

export const STATUS_COLORS = {
  todo: "#F59E0B",
  in_progress: "#3B82F6",
  done: "#10B981",
};

export const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Completed",
};

export const LEAVE_TYPE_COLORS = {
  sick: "#EF4444",
  vacation: "#3B82F6",
  personal: "#8B5CF6",
};

export const LEAVE_TYPE_LABELS = {
  sick: "Sick",
  vacation: "Vacation",
  personal: "Personal",
};

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
