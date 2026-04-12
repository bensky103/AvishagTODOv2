import Link from "next/link";
import type { ReactNode } from "react";

interface KpiCardProps {
  value: number | string;
  label: string;
  variant?: "default" | "danger" | "success" | "warning";
  href?: string;
  icon?: ReactNode;
}

const variantStyles: Record<string, { bg: string; value: string; label: string; icon: string }> = {
  default: {
    bg: "#f1f5f9",
    value: "#1e293b",
    label: "#64748b",
    icon: "#475569",
  },
  danger: {
    bg: "#fee2e2",
    value: "#dc2626",
    label: "#b91c1c",
    icon: "#ef4444",
  },
  success: {
    bg: "#d1fae5",
    value: "#059669",
    label: "#047857",
    icon: "#10b981",
  },
  warning: {
    bg: "#fef3c7",
    value: "#d97706",
    label: "#b45309",
    icon: "#f59e0b",
  },
};

export function KpiCard({ value, label, variant = "default", href, icon }: KpiCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] group"
      style={{ backgroundColor: styles.bg }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold font-heading" style={{ color: styles.value }}>
            {value}
          </p>
          <p className="text-xs font-body mt-1.5 font-medium" style={{ color: styles.label }}>
            {label}
          </p>
        </div>
        {icon && (
          <span style={{ color: styles.icon, opacity: 0.6 }}>{icon}</span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
