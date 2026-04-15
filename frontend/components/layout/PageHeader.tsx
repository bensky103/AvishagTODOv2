import type { ReactNode } from "react";
import { heroGradient } from "@/lib/theme";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header
      className="relative overflow-hidden px-5 pt-8 pb-12 text-white"
      style={{ background: heroGradient }}
    >
      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="font-heading text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/60 font-body">{subtitle}</p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
      <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-black/10 rounded-full translate-y-1/2" />
    </header>
  );
}
