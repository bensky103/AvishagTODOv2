"use client";

import { useState } from "react";
import Link from "next/link";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { useIssues } from "@/lib/queries/issues";
import { KpiCard } from "@/components/ui/KpiCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { heroGradient, tint, colors } from "@/lib/theme";
import TaskForm from "./tasks/TaskForm";
import IssueForm from "./issues/IssueForm";

export default function DashboardPage() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: issues, isLoading: loadingIssues } = useIssues();
  const toggleTask = useToggleTask();

  const today = new Date();
  const todayFormatted = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today);

  const openTasks = tasks?.filter((t) => !t.is_completed) || [];
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < today
  );
  const openIssues = issues?.filter((i) => i.status !== "resolved") || [];

  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const needsAttention = openTasks
    .filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due <= weekFromNow;
    })
    .sort(
      (a, b) =>
        (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3) -
        (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3)
    )
    .slice(0, 5);

  const recentIssues = openIssues.slice(0, 5);

  if (loadingTasks || loadingIssues) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-text-secondary font-body text-sm">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero header — teal gradient */}
      <div className="relative overflow-hidden px-5 py-8 md:py-10 text-white" style={{ background: heroGradient }}>
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-heading leading-tight">
            שלום, אבישג
          </h1>
          <p className="text-sm text-white/60 mt-1 font-body">{todayFormatted}</p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-black/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <KpiCard
            value={openTasks.length}
            label="משימות פתוחות"
            href="/tasks"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            }
          />
          <KpiCard
            value={overdueTasks.length}
            label="משימות באיחור"
            variant="danger"
            href="/tasks"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <KpiCard
            value={openIssues.length}
            label="בעיות איכות פתוחות"
            variant="warning"
            href="/issues"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid lg:grid-cols-2 gap-5 mt-6 pb-6" style={{ minHeight: "340px" }}>
          {/* Needs Attention */}
          <section className="bg-surface rounded-2xl border border-white/[0.05] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint(colors.warning, 0.12) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h2 className="text-sm font-heading text-text-primary">דורש טיפול</h2>
              </div>
              {needsAttention.length > 0 && (
                <span className="text-xs font-body text-text-secondary bg-white/[0.04] px-2.5 py-1 rounded-full">
                  {needsAttention.length} פריטים
                </span>
              )}
            </div>
            <div className="p-4">
              {needsAttention.length === 0 ? (
                <EmptyState message="אין משימות דחופות השבוע" icon="check" />
              ) : (
                <div className="space-y-2.5">
                  {needsAttention.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask.mutate(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Issues */}
          <section className="bg-surface rounded-2xl border border-white/[0.05] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint(colors.danger, 0.12) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-sm font-heading text-text-primary">בעיות איכות אחרונות</h2>
              </div>
              {recentIssues.length > 0 && (
                <Link href="/issues" className="text-xs font-body text-primary hover:text-primary-light font-medium">
                  הצג הכל
                </Link>
              )}
            </div>
            <div className="p-4">
              {recentIssues.length === 0 ? (
                <EmptyState message="אין בעיות איכות פתוחות" icon="shield" />
              ) : (
                <div className="space-y-2">
                  {recentIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href="/issues"
                      className="block rounded-xl p-3.5 hover:bg-white/[0.03] transition-colors duration-150 border border-transparent hover:border-white/[0.05]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-medium text-text-primary">
                          {issue.product_name}
                        </span>
                        <Badge
                          variant={
                            issue.status === "open"
                              ? "critical"
                              : issue.status === "in_progress"
                              ? "high"
                              : "resolved"
                          }
                        >
                          {issue.status === "open"
                            ? "פתוחה"
                            : issue.status === "in_progress"
                            ? "בטיפול"
                            : "נפתרה"}
                        </Badge>
                      </div>
                      {issue.problem_description && (
                        <p className="text-xs font-body text-text-secondary mt-1.5 line-clamp-1">
                          {issue.problem_description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 mb-3 flex items-center gap-3">
          <h2 className="text-sm font-heading text-text-primary">פעולות מהירות</h2>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 pb-8">
          <button
            onClick={() => setShowTaskForm(true)}
            className="bg-surface rounded-xl border border-white/[0.05] shadow-card p-3 md:p-5 flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:border-white/[0.1] hover:shadow-card-hover transition-all duration-200 group text-center md:text-right"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint("#6366f1", 0.12) }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-heading text-text-primary group-hover:text-white transition-colors">משימה חדשה</p>
              <p className="text-[10px] md:text-xs font-body text-text-secondary mt-0.5 hidden md:block">הוסף משימה לרשימה</p>
            </div>
          </button>
          <button
            onClick={() => setShowIssueForm(true)}
            className="bg-surface rounded-xl border border-white/[0.05] shadow-card p-3 md:p-5 flex flex-col md:flex-row items-center gap-2 md:gap-4 hover:border-white/[0.1] hover:shadow-card-hover transition-all duration-200 group text-center md:text-right"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(colors.danger, 0.12) }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-heading text-text-primary group-hover:text-white transition-colors">בעיה חדשה</p>
              <p className="text-[10px] md:text-xs font-body text-text-secondary mt-0.5 hidden md:block">דווח על בעיה</p>
            </div>
          </button>
        </div>
      </div>

      {/* Create Forms */}
      <TaskForm isOpen={showTaskForm} onClose={() => setShowTaskForm(false)} />
      <IssueForm isOpen={showIssueForm} onClose={() => setShowIssueForm(false)} />
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: "check" | "shield" }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: tint(colors.primary, 0.08) }}>
        {icon === "check" ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-body text-text-secondary">{message}</p>
    </div>
  );
}
