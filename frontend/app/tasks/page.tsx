"use client";

import { useState } from "react";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { TaskCard } from "@/components/ui/TaskCard";
import TaskForm from "./TaskForm";

type FilterOption = "all" | "open" | "completed";

const filterOptions = [
  { value: "all" as const, label: "הכל" },
  { value: "open" as const, label: "פתוחות" },
  { value: "completed" as const, label: "הושלמו" },
];

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const statusFilter =
    filter === "open"
      ? { status: "open" }
      : filter === "completed"
      ? { status: "completed" }
      : undefined;

  const { data: tasks, isLoading } = useTasks(statusFilter);
  const toggleTask = useToggleTask();

  const openCount = tasks?.filter((t) => !t.is_completed).length ?? 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="משימות"
        subtitle={`${openCount} משימות פתוחות`}
      >
        <FilterChips
          options={filterOptions}
          selected={filter}
          onChange={(val) => setFilter(val as FilterOption)}
          variant="header"
        />
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
