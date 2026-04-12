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
  critical: "bg-red-50 text-red-600 ring-1 ring-red-100",
  high: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  medium: "bg-sky-50 text-sky-600 ring-1 ring-sky-100",
  low: "bg-gray-50 text-gray-500 ring-1 ring-gray-100",
  open: "bg-red-50 text-red-600 ring-1 ring-red-100",
  in_progress: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  resolved: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
