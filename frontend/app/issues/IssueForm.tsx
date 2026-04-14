"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateIssue } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useToast } from "@/components/ui/Toast";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";

interface IssueFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IssueForm({ isOpen, onClose }: IssueFormProps) {
  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [problemDescription, setProblemDescription] = useState("");

  const { data: suppliers } = useSuppliers();
  const createIssue = useCreateIssue();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSupplierId("");
      setProductName("");
      setSku("");
      setArrivalDate("");
      setProblemDescription("");
    }
  }, [isOpen]);

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
        onSuccess: () => {
          toast("התקלה נוצרה בהצלחה", "success");
          onClose();
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
          <label className="block text-sm font-body text-text-secondary mb-1">
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
          <label className="block text-sm font-body text-text-secondary mb-1">
            שם המוצר *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="שם המוצר"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-body text-text-secondary mb-1">
            מק״ט
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="מק״ט"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
          />
        </div>

        {/* Arrival Date */}
        <div>
          <label className="block text-sm font-body text-text-secondary mb-1">
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
          <label className="block text-sm font-body text-text-secondary mb-1">
            תיאור הבעיה *
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="תיאור הבעיה"
            rows={4}
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent resize-y"
          />
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
