"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "דשבורד", icon: "📊" },
  { href: "/tasks", label: "משימות", icon: "✅" },
  { href: "/suppliers", label: "ספקים", icon: "🏢" },
  { href: "/issues", label: "תקלות", icon: "⚠️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 md:hidden">
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
                ${
                  active
                    ? "bg-brand-50 text-brand-600 shadow-pill"
                    : "text-gray-400 hover:text-gray-600"
                }
              `}
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
