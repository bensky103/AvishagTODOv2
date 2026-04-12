"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateTask, useUpdateTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import type { Task, Urgency } from "@/lib/types";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
}

export default function TaskForm({ isOpen, onClose, task }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("medium");

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { toast } = useToast();

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date || "");
      setUrgency(task.urgency as Urgency);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setUrgency("medium");
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      urgency,
    };

    if (isEditing && task) {
      updateTask.mutate(
        { id: task.id, data },
        {
          onSuccess: () => {
            toast("המשימה עודכנה בהצלחה", "success");
            onClose();
          },
          onError: () => toast("שגיאה בעדכון המשימה", "error"),
        }
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          toast("המשימה נוצרה בהצלחה", "success");
          onClose();
        },
        onError: () => toast("שגיאה ביצירת המשימה", "error"),
      });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "עדכון משימה" : "משימה חדשה"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            שם המשימה *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="שם המשימה"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            תיאור
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור (אופציונלי)"
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            תאריך יעד
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            דחיפות
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="low">נמוך</option>
            <option value="medium">בינוני</option>
            <option value="high">גבוה</option>
            <option value="critical">קריטי</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!title.trim() || isPending}
            className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {isPending
              ? "שומר..."
              : isEditing
              ? "עדכון משימה"
              : "יצירת משימה"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-body font-medium rounded-xl transition-colors text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
}
