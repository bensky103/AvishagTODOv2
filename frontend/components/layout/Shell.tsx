"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { useTasks } from "@/lib/queries/tasks";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";

const mainNav = [
  {
    href: "/",
    label: "דשבורד",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    badgeKey: null,
  },
  {
    href: "/tasks",
    label: "משימות",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    badgeKey: "tasks" as const,
  },
];

const managementNav = [
  {
    href: "/suppliers",
    label: "ספקים",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    badgeKey: "suppliers" as const,
  },
  {
    href: "/issues",
    label: "תקלות",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    badgeKey: "issues" as const,
  },
];

function Sidebar() {
  const pathname = usePathname();
  const { data: tasks } = useTasks();
  const { data: issues } = useIssues();
  const { data: suppliers } = useSuppliers();

  const openTasks = tasks?.filter((t) => !t.is_completed).length ?? 0;
  const openIssues = issues?.filter((i) => i.status !== "resolved").length ?? 0;
  const supplierCount = suppliers?.length ?? 0;

  const badgeCounts: Record<string, number> = {
    tasks: openTasks,
    issues: openIssues,
    suppliers: supplierCount,
  };

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavItem({ href, label, icon, badgeKey }: {
    href: string;
    label: string;
    icon: ReactNode;
    badgeKey: string | null;
  }) {
    const active = isActive(href);
    const count = badgeKey ? badgeCounts[badgeKey] : null;

    return (
      <Link
        href={href}
        className="nav-item-corporate"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 20px",
          position: "relative",
          transition: "all 0.2s",
          color: active ? "#14a87a" : "rgba(255,255,255,0.45)",
          fontSize: 13,
          fontWeight: active ? 500 : 400,
          backgroundColor: active ? "rgba(20,168,122,0.06)" : undefined,
          textDecoration: "none",
          borderRight: active ? "3px solid #14a87a" : "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
          }
        }}
      >
        <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
        <span>{label}</span>
        {count != null && count > 0 && (
          <span
            style={{
              marginRight: "auto",
              background: "rgba(20,168,122,0.15)",
              color: "#14a87a",
              fontSize: 10,
              fontWeight: 600,
              padding: "1px 7px",
              borderRadius: 10,
            }}
          >
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside
      className="hidden md:flex flex-col w-60 fixed top-0 bottom-0 right-0 z-40"
      style={{
        background: "linear-gradient(180deg, #1a1d23 0%, #111318 100%)",
        boxShadow: "0 0 30px rgba(0,0,0,0.3)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #14a87a, #0d8c63)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(20,168,122,0.3)",
            flexShrink: 0,
          }}
        >
          <span className="text-white font-heading text-sm">א</span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }} className="font-heading">אבישג</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>ניהול רכש</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Section: Main Navigation */}
        <div style={{
          fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)",
          padding: "12px 20px 6px", letterSpacing: 1,
        }}>
          ניווט ראשי
        </div>
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 20px" }} />

        {/* Section: Management */}
        <div style={{
          fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)",
          padding: "12px 20px 6px", letterSpacing: 1,
        }}>
          ניהול
        </div>
        {managementNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User profile */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #14a87a, #0d8c63)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: "#fff",
            flexShrink: 0,
          }}
        >
          א
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>אבישג</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>מנהלת רכש</div>
        </div>
      </div>
    </aside>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <main className="md:mr-60 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
