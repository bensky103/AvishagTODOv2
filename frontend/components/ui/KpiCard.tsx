import Link from "next/link";
import type { ReactNode } from "react";
import { variantAccent, tint } from "@/lib/theme";

interface KpiCardProps {
  value: number | string;
  label: string;
  variant?: "default" | "danger" | "success" | "warning";
  href?: string;
  icon?: ReactNode;
}

export function KpiCard({ value, label, variant = "default", href, icon }: KpiCardProps) {
  const accent = variantAccent[variant];

  const content = (
    <div
      className="bg-surface rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5 flex items-center gap-4 border border-white/[0.05]"
      style={{ borderRight: `3px solid ${accent}` }}
    >
      {icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: tint(accent, 0.09), color: accent }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold font-heading text-white">{value}</p>
        <p className="text-xs font-body text-text-secondary mt-0.5 font-medium">{label}</p>
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
