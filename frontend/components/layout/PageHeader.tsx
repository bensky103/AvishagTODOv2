import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="bg-gradient-to-l from-[#0ea5e9] to-[#0284c7] px-4 pt-6 pb-10 text-white">
      <h1 className="font-heading text-2xl">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </header>
  );
}
