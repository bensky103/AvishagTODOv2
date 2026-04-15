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
          onError: (err: Error) => toast(err.message || "שגיאה בעדכון הספק", "error"),
        }
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          toast("הספק נוצר בהצלחה", "success");
          onClose();
        },
        onError: (err: Error) => toast(err.message || "שגיאה ביצירת הספק", "error"),
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
          <label className="block text-sm font-body text-white mb-1">
            שם הספק *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם הספק"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            פרטי התקשרות
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="פרטי התקשרות"
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-body text-white mb-1">
            הערות
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות"
            rows={3}
            className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-body font-medium py-2.5 rounded-xl transition-colors text-sm"
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
            className="px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary font-body font-medium rounded-xl transition-colors text-sm"
          >
            ביטול
          </button>
        </div>
      </form>
    </Modal>
  );
}
