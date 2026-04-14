"use client";

import type { Task } from "@/lib/types";
import { Badge } from "./Badge";

const urgencyBorderColors: Record<string, string> = {
  critical: "border-r-red-500",
  high: "border-r-amber-500",
  medium: "border-r-teal-500",
  low: "border-r-gray-600",
};

const urgencyLabels: Record<string, string> = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onToggle?: (id: number) => void;
}

export function TaskCard({ task, onClick, onToggle }: TaskCardProps) {
  const overdue = !task.is_completed && isOverdue(task.due_date);

  return (
    <div
      className={`
        bg-surface rounded-xl border border-white/[0.05] shadow-card border-r-4 p-3.5 flex items-start gap-3
        transition-all duration-200 hover:shadow-card-hover hover:border-white/[0.08]
        ${urgencyBorderColors[task.urgency]}
        ${task.is_completed ? "opacity-50" : ""}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(task.id);
        }}
        className={`
          mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center
          transition-all duration-150
          ${
            task.is_completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-white/30 hover:border-emerald-400"
          }
        `}
      >
        {task.is_completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${
            task.is_completed
              ? "line-through text-text-secondary"
              : "text-text-primary"
          }`}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.due_date && (
            <span
              className={`text-xs font-body ${
                overdue ? "text-red-400 font-bold" : "text-text-secondary"
              }`}
            >
              {new Date(task.due_date).toLocaleDateString("he-IL")}
            </span>
          )}
          <Badge variant={task.urgency}>
            {urgencyLabels[task.urgency]}
          </Badge>
        </div>
      </div>
    </div>
  );
}
