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
    <div className="min-h-screen bg-slate-50">
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

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body">טוען...</p>
          </div>
        ) : tasks?.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body text-sm">אין משימות</p>
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
