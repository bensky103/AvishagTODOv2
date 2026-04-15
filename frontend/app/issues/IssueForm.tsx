"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateIssue, useAddActionItem } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";

interface IssueFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingAction {
  description: string;
  createTask: boolean;
}

export default function IssueForm({ isOpen, onClose }: IssueFormProps) {
  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [newActionDesc, setNewActionDesc] = useState("");
  const [newActionCreateTask, setNewActionCreateTask] = useState(false);

  const { data: suppliers } = useSuppliers();
  const createIssue = useCreateIssue();
  const addActionItem = useAddActionItem();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSupplierId("");
      setProductName("");
      setSku("");
      setArrivalDate("");
      setProblemDescription("");
      setActions([]);
      setNewActionDesc("");
      setNewActionCreateTask(false);
    }
  }, [isOpen]);

  const addAction = () => {
    if (!newActionDesc.trim()) return;
    setActions([...actions, { description: newActionDesc.trim(), createTask: newActionCreateTask }]);
    setNewActionDesc("");
    setNewActionCreateTask(false);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !supplierId ||
      !productName.trim() ||
      !arrivalDate ||
      !problemDescription.trim()
    )
      return;

    createIssue.mutate(
      {
        supplier_id: Number(supplierId),
        product_name: productName.trim(),
        sku: sku.trim() || undefined,
        arrival_date: arrivalDate,
        problem_description: problemDescription.trim(),
      },
      {
        onSuccess: (issue) => {
          // Create action items sequentially after issue creation
          if (actions.length > 0) {
            let completed = 0;
            actions.forEach((action) => {
              addActionItem.mutate(
                { issueId: issue.id, data: { description: action.description, create_task: action.createTask } },
                {
                  onSettled: () => {
                    completed++;
                    if (completed === actions.length) {
                      toast("התקלה נוצרה בהצלחה", "success");
                      onClose();
                    }
                  },
                }
              );
            });
          } else {
            toast("התקלה נוצרה בהצלחה", "success");
            onClose();
          }
        },
        onError: (err: Error) => toast(err.message || "שגיאה ביצירת התקלה", "error"),
      }
    );
  };

  const isValid =
    supplierId &&
    productName.trim() &&
    arrivalDate &&
    problemDescription.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="תקלה חדשה">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            ספק *
          </label>
          <Select
            value={supplierId}
            onChange={(val) => setSupplierId(val)}
            options={suppliers?.map((s) => ({ value: String(s.id), label: s.name })) || []}
            placeholder="בחר ספק"
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            שם המוצר *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="שם המוצר"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            מק״ט
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="מק״ט"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
          />
        </div>

        {/* Arrival Date */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            תאריך הגעה *
          </label>
          <DatePicker
            value={arrivalDate}
            onChange={(val) => setArrivalDate(val)}
            placeholder="בחר תאריך הגעה"
          />
        </div>

        {/* Problem Description */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            תיאור הבעיה *
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="תיאור הבעיה"
            rows={4}
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent resize-y"
          />
        </div>

        {/* Action Items */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            פעולות נדרשות
          </label>

          {/* Added actions list */}
          {actions.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {actions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 text-sm">
                  <span className="flex-1 text-text-primary font-body">{action.description}</span>
                  {action.createTask && (
                    <span className="text-[10px] font-body bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                      משימה
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAction(i)}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new action */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newActionDesc}
              onChange={(e) => setNewActionDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAction(); } }}
              placeholder="תיאור הפעולה"
              className="flex-1 bg-surface-raised border border-white/[0.06] rounded-xl px-3 py-2 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addAction}
              disabled={!newActionDesc.trim()}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-30 text-emerald-400 font-body text-sm rounded-xl transition-colors"
            >
              +
            </button>
          </div>

          {/* Create linked task toggle */}
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={newActionCreateTask}
              onChange={(e) => setNewActionCreateTask(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5"
            />
            <span className="text-xs font-body text-text-secondary">צור משימה מקושרת</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!isValid || createIssue.isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {createIssue.isPending ? "יוצר..." : "יצירת תקלה"}
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
