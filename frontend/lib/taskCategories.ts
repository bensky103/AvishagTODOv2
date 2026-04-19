export const TASK_CATEGORIES = [
  { value: "work", label: "עבודה", icon: "💼" },
  { value: "vaad", label: "ועד בית", icon: "🏠" },
  { value: "personal", label: "אישי", icon: "👤" },
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number]["value"];
