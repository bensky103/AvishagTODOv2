"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateTask, useUpdateTask } from "@/lib/queries/tasks";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import type { Task, Urgency } from "@/lib/types";

const urgencyOptions = [
  { value: "low", label: "נמוך" },
  { value: "medium", label: "בינוני" },
  { value: "high", label: "גבוה" },
  { value: "critical", label: "קריטי" },
];

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
          onError: (err: Error) => toast(err.message || "שגיאה בעדכון המשימה", "error"),
        }
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          toast("המשימה נוצרה בהצלחה", "success");
          onClose();
        },
        onError: (err: Error) => toast(err.message || "שגיאה ביצירת המשימה", "error"),
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
          <label className="block text-sm font-body text-white mb-1">
            שם המשימה *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="שם המשימה"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            תיאור
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור (אופציונלי)"
            rows={3}
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent resize-y"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            תאריך יעד
          </label>
          <DatePicker
            value={dueDate}
            onChange={(val) => setDueDate(val)}
            placeholder="בחר תאריך יעד"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            דחיפות
          </label>
          <Select
            value={urgency}
            onChange={(val) => setUrgency(val as Urgency)}
            options={urgencyOptions}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!title.trim() || isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
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
            className="px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary font-body font-medium rounded-xl transition-colors text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
}
