export const MOOD_THRESHOLDS = {
  closed: { min: 0, max: 30, label: "闭门谢客" },
  low: { min: 30, max: 50, label: "情绪低落" },
  calm: { min: 50, max: 70, label: "平心静气" },
  engaged: { min: 70, max: 85, label: "谈兴正盛" },
  passionate: { min: 85, max: 100, label: "豪情万丈" },
} as const;

export const TENSION_THRESHOLDS = {
  high: 80,
  mid: 50,
  low: 0,
} as const;

export const TENSION_STATUS_LABELS = {
  high: "高张力待触发",
  mid: "蓄势中",
  low: "低烈度蓄势",
} as const;
