"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateSupplier, useUpdateSupplier } from "@/lib/queries/suppliers";
import { useToast } from "@/components/ui/Toast";
import type { Supplier } from "@/lib/types";

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier;
}

export default function SupplierForm({
  isOpen,
  onClose,
  supplier,
}: SupplierFormProps) {
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const { toast } = useToast();

  const isEditing = !!supplier;

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactInfo(supplier.contact_info || "");
      setNotes(supplier.notes || "");
    } else {
      setName("");
      setContactInfo("");
      setNotes("");
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      contact_info: contactInfo.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing && supplier) {
      updateSupplier.mutate(
        { id: supplier.id, data },
        {
          onSuccess: () => {
            toast("הספק עודכן בהצלחה", "success");
            onClose();
          },
          onError: () => toast("שגיאה בעדכון הספק", "error"),
        }
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          toast("הספק נוצר בהצלחה", "success");
          onClose();
        },
        onError: () => toast("שגיאה ביצירת הספק", "error"),
      });
    }
  };

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "עדכון ספק" : "ספק חדש"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            שם הספק *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם הספק"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            פרטי התקשרות
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="פרטי התקשרות"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-body text-gray-600 mb-1">
            הערות
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות"
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {isPending
              ? "שומר..."
              : isEditing
              ? "עדכון ספק"
              : "יצירת ספק"}
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
