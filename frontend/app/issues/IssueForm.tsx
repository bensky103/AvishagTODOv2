"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateIssue } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useToast } from "@/components/ui/Toast";

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
        onError: () => toast("שגיאה ביצירת התקלה", "error"),
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
          <label className="block text-sm font-body text-gray-600 mb-1">
            ספק *
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="">בחר ספק</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            שם המוצר *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="שם המוצר"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            מק״ט
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="מק״ט"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Arrival Date */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            תאריך הגעה *
          </label>
          <input
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Problem Description */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            תיאור הבעיה *
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="תיאור הבעיה"
            rows={4}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!isValid || createIssue.isPending}
            className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {createIssue.isPending ? "יוצר..." : "יצירת תקלה"}
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
