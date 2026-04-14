"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useTask, useToggleTask, useDeleteTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import TaskForm from "./TaskForm";

interface TaskDetailProps {
  taskId: number | null;
  onClose: () => void;
}

export default function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { data: task, isLoading } = useTask(taskId);
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
            <p className="text-text-secondary font-body">טוען...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title + Badge */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-heading text-text-primary">
                {task.title}
              </h2>
              <Badge variant={task.urgency}>
                {{ critical: "קריטי", high: "גבוה", medium: "בינוני", low: "נמוך" }[task.urgency]}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-body text-text-secondary mb-1">תיאור</p>
                <p className="text-sm font-body text-text-secondary">
                  {task.description}
                </p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              {task.due_date && (
                <div>
                  <p className="text-xs font-body text-text-secondary mb-1">
                    תאריך יעד
                  </p>
                  <p className="text-sm font-body text-text-primary">
                    {new Date(task.due_date).toLocaleDateString("he-IL")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-body text-text-secondary mb-1">סטטוס</p>
                <p className="text-sm font-body text-text-primary">
                  {task.is_completed ? "הושלמה" : "פתוחה"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
              <button
                onClick={handleToggle}
                className={`flex-1 py-2.5 rounded-xl font-body font-medium text-sm transition-colors ${
                  task.is_completed
                    ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {task.is_completed ? "פתיחה מחדש" : "סימון כהושלמה"}
              </button>
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                עריכה
              </button>
            </div>

            {/* Delete */}
            <div className="pt-1">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 rounded-xl font-body text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  מחיקת משימה
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      deleteTask.mutate(task.id, {
                        onSuccess: () => { toast("המשימה נמחקה", "success"); onClose(); },
                        onError: (err: Error) => toast(err.message || "שגיאה במחיקה", "error"),
                      });
                    }}
                    disabled={deleteTask.isPending}
                    className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    {deleteTask.isPending ? "מוחק..." : "אישור מחיקה"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs font-body text-text-secondary pt-2">
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
