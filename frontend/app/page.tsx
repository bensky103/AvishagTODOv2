"use client";

import Link from "next/link";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { KpiCard } from "@/components/ui/KpiCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: issues, isLoading: loadingIssues } = useIssues();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
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

  if (loadingTasks || loadingIssues || loadingSuppliers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-text-secondary font-body text-sm">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero header — visible on mobile, compact on desktop since sidebar has branding */}
      <div className="relative overflow-hidden bg-gradient-to-bl from-brand-600 via-brand-500 to-brand-700 px-5 pt-8 pb-12 md:pt-8 md:pb-10 text-white">
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-heading leading-tight">
            שלום, אבישג
          </h1>
          <p className="text-sm text-white/70 mt-1 font-body">{todayFormatted}</p>
        </div>
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full" />
      </div>

      {/* Content — pulled up over the header */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            label="תקלות פתוחות"
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
          <KpiCard
            value={suppliers?.length || 0}
            label="ספקים"
            variant="success"
            href="/suppliers"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          />
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid lg:grid-cols-2 gap-5 mt-6 pb-6">
          {/* Needs Attention */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h2 className="text-sm font-heading text-gray-900">דורש טיפול</h2>
              </div>
              {needsAttention.length > 0 && (
                <span className="text-xs font-body text-text-secondary bg-gray-50 px-2.5 py-1 rounded-full">
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
          <section className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-sm font-heading text-gray-900">תקלות אחרונות</h2>
              </div>
              {recentIssues.length > 0 && (
                <Link href="/issues" className="text-xs font-body text-brand-600 hover:text-brand-700 font-medium">
                  הצג הכל
                </Link>
              )}
            </div>
            <div className="p-4">
              {recentIssues.length === 0 ? (
                <EmptyState message="אין תקלות פתוחות" icon="shield" />
              ) : (
                <div className="space-y-2">
                  {recentIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href="/issues"
                      className="block rounded-xl p-3.5 hover:bg-gray-50 transition-colors duration-150 border border-transparent hover:border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-medium text-gray-900">
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
      </div>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: "check" | "shield" }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        {icon === "check" ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-body text-text-secondary">{message}</p>
    </div>
  );
}
