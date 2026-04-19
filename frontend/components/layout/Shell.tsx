"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { useTasks } from "@/lib/queries/tasks";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useAuth } from "@/lib/auth";
import { colors, brandGradient, tint, SIDEBAR_WIDE, SIDEBAR_NARROW } from "@/lib/theme";
import { TASK_CATEGORIES } from "@/lib/taskCategories";

const C = {
  bg: colors.sidebarBg,
  accent: colors.primary,
  accentLight: colors.primaryLight,
  accentGlow: tint(colors.primary, 0.2),
  accentBg: tint(colors.primary, 0.1),
  accentBadge: tint(colors.primary, 0.15),
  textMuted: colors.textMuted,
  textDefault: colors.textDefault,
  textHover: colors.textHover,
  textActive: colors.primaryLight,
  border: colors.borderSubtle,
};

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
];

const tasksIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);

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

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: tasks } = useTasks();
  const { data: issues } = useIssues();
  const { data: suppliers } = useSuppliers();

  const [tasksExpanded, setTasksExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("sidebar_tasks_expanded");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_tasks_expanded", String(tasksExpanded));
    }
  }, [tasksExpanded]);

  const openTasks = tasks?.filter((t) => !t.is_completed).length ?? 0;
  const openIssues = issues?.filter((i) => i.status !== "resolved").length ?? 0;
  const supplierCount = suppliers?.length ?? 0;

  // Per-category open task counts
  const catCounts = Object.fromEntries(
    TASK_CATEGORIES.map((c) => [
      c.value,
      tasks?.filter((t) => !t.is_completed && t.category === c.value).length ?? 0,
    ])
  );

  const badgeCounts: Record<string, number> = {
    tasks: openTasks,
    issues: openIssues,
    suppliers: supplierCount,
  };

  // Active category from URL param
  const activeCategoryParam = searchParams.get("category");

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
        title={collapsed ? label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : undefined,
          padding: collapsed ? "10px 0" : "9px 20px",
          position: "relative",
          transition: "all 0.2s",
          color: active ? C.textActive : C.textDefault,
          fontSize: 13,
          fontWeight: active ? 500 : 400,
          backgroundColor: active ? C.accentBg : undefined,
          textDecoration: "none",
          borderRight: active ? `3px solid ${C.accent}` : "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
            e.currentTarget.style.color = C.textHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "";
            e.currentTarget.style.color = C.textDefault;
          }
        }}
      >
        <span style={{ flexShrink: 0, display: "flex", color: active ? C.accent : "inherit" }}>{icon}</span>
        {!collapsed && <span>{label}</span>}
        {!collapsed && count != null && count > 0 && (
          <span
            style={{
              marginRight: "auto",
              background: C.accentBadge,
              color: C.accentLight,
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

  const width = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;

  return (
    <aside
      className="hidden md:flex flex-col fixed top-0 bottom-0 right-0 z-40"
      style={{
        width,
        background: C.bg,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.3)",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        borderLeft: `1px solid ${C.border}`,
      }}
    >
      {/* Brand */}
      <div style={{
        padding: collapsed ? "24px 0 20px" : "24px 20px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : undefined,
        gap: collapsed ? 0 : 12,
        borderBottom: `1px solid ${C.border}`,
        transition: "padding 0.25s",
      }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: brandGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px ${C.accentGlow}`,
            flexShrink: 0,
          }}
        >
          <span className="text-white font-heading text-sm">א</span>
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }} className="font-heading">אבישג</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>ניהול רכש</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden" }}>
        {!collapsed && (
          <div style={{
            fontSize: 10, fontWeight: 600, color: C.textMuted,
            padding: "12px 20px 6px", letterSpacing: 1,
          }}>
            ניווט ראשי
          </div>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Tasks expandable group */}
        {(() => {
          const tasksActive = isActive("/tasks");
          return (
            <div>
              {/* Parent row */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <Link
                  href="/tasks"
                  title={collapsed ? "משימות" : undefined}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : undefined,
                    padding: collapsed ? "10px 0" : "9px 20px",
                    paddingLeft: collapsed ? undefined : (tasksExpanded ? 16 : 20),
                    position: "relative",
                    transition: "all 0.2s",
                    color: tasksActive ? C.textActive : C.textDefault,
                    fontSize: 13,
                    fontWeight: tasksActive ? 500 : 400,
                    backgroundColor: tasksActive ? C.accentBg : undefined,
                    textDecoration: "none",
                    borderRight: tasksActive ? `3px solid ${C.accent}` : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!tasksActive) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.color = C.textHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tasksActive) {
                      e.currentTarget.style.backgroundColor = "";
                      e.currentTarget.style.color = C.textDefault;
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, display: "flex", color: tasksActive ? C.accent : "inherit" }}>{tasksIcon}</span>
                  {!collapsed && <span>משימות</span>}
                  {!collapsed && openTasks > 0 && (
                    <span style={{
                      marginRight: "auto",
                      background: C.accentBadge,
                      color: C.accentLight,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 10,
                    }}>
                      {openTasks}
                    </span>
                  )}
                </Link>
                {/* Chevron toggle — only in expanded sidebar */}
                {!collapsed && (
                  <button
                    onClick={() => setTasksExpanded((v) => !v)}
                    title={tasksExpanded ? "כווץ" : "הרחב"}
                    aria-expanded={tasksExpanded}
                    aria-controls="tasks-subnav"
                    style={{
                      padding: "9px 12px 9px 4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: C.textMuted,
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = C.textHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; }}
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: tasksExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sub-items — only when sidebar expanded and group expanded */}
              {!collapsed && tasksExpanded && (
                <div id="tasks-subnav" style={{ paddingBottom: 4 }}>
                  {TASK_CATEGORIES.map((cat) => {
                    const subActive = tasksActive && activeCategoryParam === cat.value;
                    const count = catCounts[cat.value] ?? 0;
                    return (
                      <Link
                        key={cat.value}
                        href={`/tasks?category=${cat.value}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 20px 6px 36px",
                          fontSize: 12,
                          fontWeight: subActive ? 500 : 400,
                          color: subActive ? C.textActive : C.textMuted,
                          backgroundColor: subActive ? C.accentBg : undefined,
                          textDecoration: "none",
                          borderRight: subActive ? `3px solid ${C.accent}` : "3px solid transparent",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!subActive) {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.color = C.textHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!subActive) {
                            e.currentTarget.style.backgroundColor = "";
                            e.currentTarget.style.color = C.textMuted;
                          }
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{cat.icon}</span>
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        {count > 0 && (
                          <span style={{
                            background: C.accentBadge,
                            color: C.accentLight,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: 8,
                          }}>
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Divider */}
        <div style={{ height: 1, background: C.border, margin: collapsed ? "8px 12px" : "8px 20px" }} />

        {!collapsed && (
          <div style={{
            fontSize: 10, fontWeight: 600, color: C.textMuted,
            padding: "12px 20px 6px", letterSpacing: 1,
          }}>
            ניהול
          </div>
        )}
        {managementNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={collapsed ? "הרחב תפריט" : "כווץ תפריט"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 0",
          borderTop: `1px solid ${C.border}`,
          color: C.textDefault,
          background: "transparent",
          border: "none",
          borderTopStyle: "solid",
          borderTopWidth: 1,
          borderTopColor: C.border,
          cursor: "pointer",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.textHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.textDefault; }}
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? undefined : "scaleX(-1)", transition: "transform 0.25s" }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* User profile */}
      <div style={{
        padding: collapsed ? "16px 0" : "16px 20px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : undefined,
        gap: collapsed ? 0 : 10,
      }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: brandGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: "#fff",
            flexShrink: 0,
          }}
        >
          א
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>אבישג</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>מנהלת רכש</div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;

  // Login page renders without the shell chrome
  if (pathname === "/login") return <>{children}</>;

  // While middleware handles the redirect, avoid rendering the shell without auth
  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-base">
      <Suspense fallback={null}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </Suspense>
      <main
        className="pb-20 md:pb-6"
        style={{
          marginRight: undefined,
          transition: "margin-right 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .shell-main { margin-right: ${sidebarWidth}px !important; }
          }
        `}</style>
        <div className="shell-main">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
