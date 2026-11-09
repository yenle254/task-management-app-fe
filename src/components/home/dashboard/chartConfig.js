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
  backgroundColor: "#FFFFFF",
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  backgroundGradientFromOpacity: 1,
  backgroundGradientToOpacity: 1,
  fillShadowGradientFrom: Colors.primary,
  fillShadowGradientFromOpacity: 0.24,
  fillShadowGradientTo: "#FFFFFF",
  fillShadowGradientToOpacity: 0.02,
  decimalPlaces: 0,
  barPercentage: 0.58,
  barRadius: 6,
  color: (opacity = 1) => rgbaFromHex(Colors.primary, opacity),
  labelColor: (opacity = 1) => rgbaFromHex("#475467", opacity),
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4.5",
    strokeWidth: "2.5",
    stroke: Colors.primary,
    fill: "#FFFFFF",
  },
  propsForBackgroundLines: {
    stroke: rgbaFromHex("#98A2B3", 0.22),
    strokeDasharray: "4, 4",
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 11,
    fontWeight: "500",
  },
};

export const METRIC_CARD_THEMES = [
  { bg: "#EFF4FF", border: "#DBEAFE", accent: "#2563EB", badgeBg: "#DBEAFE", badgeText: "#1D4ED8" },
  { bg: "#F4F3FF", border: "#E9D7FE", accent: "#7057FC", badgeBg: "#E9D7FE", badgeText: "#6938EF" },
  { bg: "#ECFDF3", border: "#D1FADF", accent: "#10B981", badgeBg: "#D1FADF", badgeText: "#047857" },
  { bg: "#FFF6ED", border: "#FFEDD5", accent: "#F59E0B", badgeBg: "#FFEDD5", badgeText: "#B45309" },
  { bg: "#FEF3F2", border: "#FEE4E2", accent: "#EF4444", badgeBg: "#FEE4E2", badgeText: "#B91C1C" },
];

export const STATUS_COLORS = {
  todo: "#F59E0B",
  in_progress: "#3B82F6",
  in_review: "#6941C6",
  done: "#10B981",
};

export const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Completed",
};

export const PRIORITY_COLORS = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#EF4444",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const LEAVE_TYPE_COLORS = {
  sick: "#EF4444",
  vacation: "#3B82F6",
  personal: "#8B5CF6",
  annual: "#3B82F6",
  unpaid: "#F59E0B",
  maternity: "#EC4899",
  paternity: "#06B6D4",
  bereavement: "#64748B",
};

export const LEAVE_TYPE_LABELS = {
  sick: "Sick",
  vacation: "Vacation",
  personal: "Personal",
  annual: "Annual",
  unpaid: "Unpaid",
  maternity: "Maternity",
  paternity: "Paternity",
  bereavement: "Bereavement",
};

export const DISTRIBUTION_COLORS = {
  ...STATUS_COLORS, ...PRIORITY_COLORS, ...LEAVE_TYPE_COLORS,
  present: STATUS_COLORS.done, late: STATUS_COLORS.todo, absent: LEAVE_TYPE_COLORS.sick,
};
export const DISTRIBUTION_LABELS = {
  ...STATUS_LABELS, ...PRIORITY_LABELS, ...LEAVE_TYPE_LABELS,
  present: 'Present', late: 'Late', absent: 'Absent',
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
