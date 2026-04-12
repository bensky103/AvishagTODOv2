"use client";

import { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/lib/queries/tasks";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { KpiCard } from "@/components/ui/KpiCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { Badge } from "@/components/ui/Badge";
import { useToggleTask } from "@/lib/queries/tasks";

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
        <p className="text-gray-400 font-body text-lg">טוען...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 md:p-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          שלום, אבישג 👋
        </h1>
        <p className="text-sm font-body text-gray-500 mt-1">{todayFormatted}</p>
      </div>

      {/* KPI Cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard value={openTasks.length} label="משימות פתוחות" />
        <KpiCard
          value={overdueTasks.length}
          label="משימות באיחור"
          variant="danger"
        />
        <KpiCard value={openIssues.length} label="תקלות פתוחות" />
        <KpiCard value={suppliers?.length || 0} label="ספקים" />
      </div>

      {/* Needs Attention */}
      <section>
        <h2 className="text-lg font-heading text-gray-900 mb-3">
          ⚠️ דורש טיפול
        </h2>
        {needsAttention.length === 0 ? (
          <p className="text-sm font-body text-gray-400">
            אין משימות דחופות השבוע 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {needsAttention.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTask.mutate(task)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Issues */}
      <section>
        <h2 className="text-lg font-heading text-gray-900 mb-3">
          תקלות אחרונות
        </h2>
        {recentIssues.length === 0 ? (
          <p className="text-sm font-body text-gray-400">אין תקלות פתוחות</p>
        ) : (
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <Link
                key={issue.id}
                href="/issues"
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
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
                  <p className="text-xs font-body text-gray-500 mt-1 line-clamp-1">
                    {issue.problem_description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
