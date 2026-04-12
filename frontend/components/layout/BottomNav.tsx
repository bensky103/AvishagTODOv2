"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "דשבורד", icon: "\uD83D\uDCCA" },
  { href: "/tasks", label: "משימות", icon: "\u2705" },
  { href: "/suppliers", label: "ספקים", icon: "\uD83C\uDFE2" },
  { href: "/issues", label: "תקלות", icon: "\u26A0\uFE0F" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full
                transition-all duration-200 text-xs font-medium
                ${
                  active
                    ? "bg-ocean-100 text-ocean-600 shadow-pill"
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
