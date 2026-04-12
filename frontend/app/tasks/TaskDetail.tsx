"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useTask, useToggleTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import TaskForm from "./TaskForm";

interface TaskDetailProps {
  taskId: number | null;
  onClose: () => void;
}

export default function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { data: task, isLoading } = useTask(taskId!);
  const toggleTask = useToggleTask();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);

  if (!taskId) return null;

  const handleToggle = () => {
    if (!task) return;
    toggleTask.mutate(task, {
      onSuccess: () => {
        toast(
          task.is_completed ? "המשימה נפתחה מחדש" : "המשימה הושלמה",
          "success"
        );
      },
      onError: () => toast("שגיאה בעדכון המשימה", "error"),
    });
  };

  return (
    <>
      <Modal isOpen={!!taskId} onClose={onClose} title="פרטי משימה">
        {isLoading || !task ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 font-body">טוען...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title + Badge */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-heading text-gray-900">
                {task.title}
              </h2>
              <Badge variant={task.urgency}>
                {{ critical: "קריטי", high: "גבוה", medium: "בינוני", low: "נמוך" }[task.urgency]}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-body text-gray-500 mb-1">תיאור</p>
                <p className="text-sm font-body text-gray-700">
                  {task.description}
                </p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              {task.due_date && (
                <div>
                  <p className="text-xs font-body text-gray-500 mb-1">
                    תאריך יעד
                  </p>
                  <p className="text-sm font-body text-gray-900">
                    {new Date(task.due_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-body text-gray-500 mb-1">סטטוס</p>
                <p className="text-sm font-body text-gray-900">
                  {task.is_completed ? "הושלמה" : "פתוחה"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={handleToggle}
                className={`flex-1 py-2.5 rounded-xl font-body font-medium text-sm transition-colors ${
                  task.is_completed
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {task.is_completed ? "פתיחה מחדש" : "סימון כהושלמה"}
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
              >
                עריכה
              </button>
            </div>

            {/* Metadata */}
            <div className="text-xs font-body text-gray-400 pt-2">
              <p>
                נוצרה:{" "}
                {new Date(task.created_at).toLocaleDateString("he-IL")}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {showEdit && task && (
        <TaskForm
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          task={task}
        />
      )}
    </>
  );
}
