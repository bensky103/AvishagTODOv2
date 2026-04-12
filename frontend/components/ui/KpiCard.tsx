import Link from "next/link";
import type { ReactNode } from "react";

interface KpiCardProps {
  value: number | string;
  label: string;
  variant?: "default" | "danger" | "success" | "warning";
  href?: string;
  icon?: ReactNode;
}

const variantAccent: Record<string, string> = {
  default: "#6366f1",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
};

export function KpiCard({ value, label, variant = "default", href, icon }: KpiCardProps) {
  const accent = variantAccent[variant];

  const content = (
    <div
      className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 flex items-center gap-4"
      style={{ borderRight: `4px solid ${accent}` }}
    >
      {icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}12`, color: accent }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold font-heading text-gray-900">{value}</p>
        <p className="text-xs font-body text-gray-500 mt-0.5 font-medium">{label}</p>
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
