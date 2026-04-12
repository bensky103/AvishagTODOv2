"use client";

import { useState } from "react";
import { useTasks, useToggleTask } from "@/lib/queries/tasks";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { TaskCard } from "@/components/ui/TaskCard";
import { FAB } from "@/components/ui/FAB";
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
            <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

      <FAB onClick={() => setShowCreate(true)} />

      <TaskForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {editingTask && (
        <TaskForm
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}
    </div>
  );
}
