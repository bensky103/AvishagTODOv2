"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, tint } from "@/lib/theme";

const tabs = [
  { href: "/", label: "דשבורד", icon: "📊" },
  { href: "/tasks", label: "משימות", icon: "✅" },
  { href: "/suppliers", label: "ספקים", icon: "🏢" },
  { href: "/issues", label: "בעיות איכות", icon: "⚠️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden" style={{ background: tint(colors.sidebarBg, 0.9), backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${colors.borderSubtle}` }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl
                transition-all duration-200 text-xs font-medium
                ${active ? "" : "text-gray-500 hover:text-gray-300"}
              `}
              style={active ? { backgroundColor: tint(colors.primary, 0.12), color: colors.primaryLight } : undefined}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
