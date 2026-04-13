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
  critical: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  high: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  medium: "bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20",
  low: "bg-white/[0.04] text-text-secondary ring-1 ring-white/[0.06]",
  open: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
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
