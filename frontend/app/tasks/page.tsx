"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { TaskCard } from "@/components/ui/TaskCard";
import { TASK_CATEGORIES } from "@/lib/taskCategories";
import type { TaskCategory } from "@/lib/taskCategories";
import TaskForm from "./TaskForm";

type StatusFilter = "open" | "completed";
type RecurringFilter = "all" | "regular" | "recurring";

const statusOptions = [
  { value: "open" as const, label: "פתוחות" },
  { value: "completed" as const, label: "הושלמו" },
];

const recurringOptions = [
  { value: "all", label: "הכל" },
  { value: "regular", label: "רגילות" },
  { value: "recurring", label: "⏰ קבועות" },
];

const categoryOptions = [
  { value: "all", label: "הכל" },
  ...TASK_CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` })),
];

const VALID_CATEGORIES: TaskCategory[] = ["work", "vaad", "personal"];

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // category: URL param
  const paramCategory = searchParams.get("category") as TaskCategory | "all" | null;
  const categoryFilter: TaskCategory | "all" =
    paramCategory && (VALID_CATEGORIES.includes(paramCategory as TaskCategory) || paramCategory === "all")
      ? paramCategory
      : "all";

  const setCategory = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val === "all") {
        params.delete("category");
      } else {
        params.set("category", val);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    },
    [searchParams, router]
  );

  // status: URL param — defaults to "open" so category=all view never shows completed tasks
  const VALID_STATUSES: StatusFilter[] = ["open", "completed"];
  const paramStatus = searchParams.get("status") as StatusFilter | null;
  const statusFilter: StatusFilter =
    paramStatus && VALID_STATUSES.includes(paramStatus)
      ? paramStatus
      : "open";

  const setStatus = useCallback(
    (val: StatusFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val === "open") {
        params.delete("status");
      } else {
        params.set("status", val);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    },
    [searchParams, router]
  );

  // recurring: URL param
  const VALID_RECURRING: RecurringFilter[] = ["all", "regular", "recurring"];
  const paramRecurring = searchParams.get("recurring") as RecurringFilter | null;
  const recurringFilter: RecurringFilter =
    paramRecurring && VALID_RECURRING.includes(paramRecurring) ? paramRecurring : "all";

  const setRecurring = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val === "all") {
        params.delete("recurring");
      } else {
        params.set("recurring", val);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    },
    [searchParams, router]
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const queryFilters: Record<string, string> = { status: statusFilter };
  if (categoryFilter !== "all") queryFilters.category = categoryFilter;
  if (recurringFilter === "recurring") queryFilters.is_recurring_monthly = "true";
  else if (recurringFilter === "regular") queryFilters.is_recurring_monthly = "false";

  const { data: tasks, isLoading } = useTasks(
    Object.keys(queryFilters).length > 0 ? queryFilters : undefined
  );
  const toggleTask = useToggleTask();

  const openCount = tasks?.filter((t) => !t.is_completed).length ?? 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="משימות"
        subtitle={`${openCount} משימות פתוחות`}
      >
        <div className="flex flex-col gap-2">
          {/* Category filter row */}
          <FilterChips
            options={categoryOptions}
            selected={categoryFilter}
            onChange={setCategory}
            variant="header"
          />
          {/* Status filter row */}
          <FilterChips
            options={statusOptions}
            selected={statusFilter}
            onChange={(val) => setStatus(val as StatusFilter)}
            variant="header"
          />
          {/* Recurring filter row */}
          <FilterChips
            options={recurringOptions}
            selected={recurringFilter}
            onChange={setRecurring}
            variant="header"
          />
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto p-4 md:p-6 -mt-4 space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(20,168,122,0.08)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14a87a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="text-text-secondary font-body text-sm">אין משימות</p>
          </div>
        ) : (
          tasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setEditingTask(task)}
              onToggle={() => toggleTask.mutate(task)}
            />
          ))
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 md:bottom-8 left-6 z-50 rounded-2xl text-white shadow-lg
          flex items-center gap-2 px-5 py-3 hover:shadow-xl active:scale-95 transition-all duration-200 font-body font-medium text-sm"
        style={{
          background: "linear-gradient(135deg, #14a87a, #0d8c63)",
          boxShadow: "0 4px 14px rgba(20,168,122,0.35)",
        }}
      >
        הוסף משימה
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <TaskForm
        isOpen={showCreate && !editingTask}
        onClose={() => setShowCreate(false)}
      />

      {editingTask && (
        <TaskForm
          isOpen={!!editingTask && !showCreate}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}
    </div>
  );
}
