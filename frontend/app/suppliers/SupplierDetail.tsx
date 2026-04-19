"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useSupplier, useDeleteSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { useToast } from "@/components/ui/Toast";
import SupplierForm from "./SupplierForm";

interface SupplierDetailProps {
  supplierId: number | null;
  onClose: () => void;
}

export default function SupplierDetail({
  supplierId,
  onClose,
}: SupplierDetailProps) {
  const { data: supplier, isLoading } = useSupplier(supplierId!);
  const { data: allIssues } = useIssues();
  const deleteSupplier = useDeleteSupplier();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!supplierId) return null;

  const supplierIssues =
    allIssues?.filter((i) => i.supplier_id === supplierId) || [];

  return (
    <>
      <Modal isOpen={!!supplierId} onClose={onClose} title="פרטי ספק">
        {isLoading || !supplier ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-text-secondary font-body">טוען...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Supplier Info */}
            <div>
              <h2 className="text-lg font-heading text-text-primary">
                {supplier.name}
              </h2>
              {supplier.contact_info && (
                <p className="text-sm font-body text-text-secondary mt-1">
                  {supplier.contact_info}
                </p>
              )}
              {supplier.notes && (
                <p className="text-sm font-body text-gray-400 mt-2">
                  {supplier.notes}
                </p>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setShowEdit(true)}
              className="w-full py-2.5 rounded-xl font-body font-medium text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              עריכה
            </button>

            {/* Issues */}
            <div>
              <h3 className="text-sm font-heading text-text-primary mb-3">
                בעיות איכות ({supplierIssues.length})
              </h3>
              {supplierIssues.length === 0 ? (
                <p className="text-sm font-body text-text-secondary">
                  אין בעיות איכות לספק זה
                </p>
              ) : (
                <div className="space-y-2">
                  {supplierIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href="/issues"
                      onClick={onClose}
                      className="block bg-white/[0.03] rounded-xl p-3 hover:bg-white/[0.06] transition-colors border border-white/[0.04]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-text-primary">
                          {issue.product_name}
                        </span>
                        <Badge
                          variant={
                            issue.status === "open"
                              ? "open"
                              : issue.status === "in_progress"
                              ? "in_progress"
                              : "resolved"
                          }
                        >
                          {issue.status === "open"
                            ? "פתוחה"
                            : issue.status === "in_progress"
                            ? "בטיפול"
                            : "נפתרה"}
                        </Badge>
                      </div>
                      {issue.problem_description && (
                        <p className="text-xs font-body text-text-secondary mt-1 line-clamp-1">
                          {issue.problem_description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs font-body text-text-secondary pt-2 border-t border-white/[0.05]">
              <p>
                נוצר:{" "}
                {new Date(supplier.created_at).toLocaleDateString("he-IL")}
              </p>
            </div>

            {/* Delete */}
            <div className="pt-1">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2 rounded-xl font-body text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  מחיקת ספק
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      deleteSupplier.mutate(supplier.id, {
                        onSuccess: () => { toast("הספק נמחק", "success"); onClose(); },
                        onError: (err: Error) => toast(err.message || "שגיאה במחיקה", "error"),
                      });
                    }}
                    disabled={deleteSupplier.isPending}
                    className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    {deleteSupplier.isPending ? "מוחק..." : "אישור מחיקה"}
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
          </div>
        )}
      </Modal>

      {showEdit && supplier && (
        <SupplierForm
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          supplier={supplier}
        />
      )}
    </>
  );
}
