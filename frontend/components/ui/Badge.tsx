import type { ReactNode } from "react";

type BadgeVariant =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "open"
  | "in_progress"
  | "resolved";

const variantClasses: Record<BadgeVariant, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high: "bg-amber-100 text-amber-700 border border-amber-200",
  medium: "bg-sky-100 text-sky-700 border border-sky-200",
  low: "bg-gray-100 text-gray-600 border border-gray-200",
  open: "bg-red-100 text-red-700 border border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border border-amber-200",
  resolved: "bg-green-100 text-green-700 border border-green-200",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
