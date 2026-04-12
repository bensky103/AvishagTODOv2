"use client";

import type { Task } from "@/lib/types";
import { Badge } from "./Badge";

const urgencyBorderColors: Record<string, string> = {
  critical: "border-r-[#ef4444]",
  high: "border-r-[#f59e0b]",
  medium: "border-r-[#0ea5e9]",
  low: "border-r-[#d1d5db]",
};

const urgencyLabels: Record<string, string> = {
  critical: "\u05E7\u05E8\u05D9\u05D8\u05D9",
  high: "\u05D2\u05D1\u05D5\u05D4",
  medium: "\u05D1\u05D9\u05E0\u05D5\u05E0\u05D9",
  low: "\u05E0\u05DE\u05D5\u05DA",
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
        bg-white rounded-xl shadow-card border-r-4 p-3 flex items-start gap-3
        transition-opacity duration-200
        ${urgencyBorderColors[task.urgency]}
        ${task.is_completed ? "opacity-60" : ""}
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
          mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-colors duration-150
          ${
            task.is_completed
              ? "bg-gray-700 border-gray-700"
              : "border-gray-300 hover:border-ocean-400"
          }
        `}
      >
        {task.is_completed && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-tight ${
            task.is_completed
              ? "line-through text-gray-400"
              : "text-gray-900"
          }`}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.due_date && (
            <span
              className={`text-xs ${
                overdue ? "text-red-500 font-bold" : "text-gray-400"
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
