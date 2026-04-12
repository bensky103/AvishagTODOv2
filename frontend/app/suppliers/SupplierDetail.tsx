"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useSupplier } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
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
  const [showEdit, setShowEdit] = useState(false);

  if (!supplierId) return null;

  const supplierIssues =
    allIssues?.filter((i) => i.supplier_id === supplierId) || [];

  return (
    <>
      <Modal isOpen={!!supplierId} onClose={onClose} title="פרטי ספק">
        {isLoading || !supplier ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-400 font-body">טוען...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Supplier Info */}
            <div>
              <h2 className="text-lg font-heading text-gray-900">
                {supplier.name}
              </h2>
              {supplier.contact_info && (
                <p className="text-sm font-body text-gray-600 mt-1">
                  {supplier.contact_info}
                </p>
              )}
              {supplier.notes && (
                <p className="text-sm font-body text-gray-500 mt-2">
                  {supplier.notes}
                </p>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setShowEdit(true)}
              className="w-full py-2.5 rounded-xl font-body font-medium text-sm bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              עריכה
            </button>

            {/* Issues */}
            <div>
              <h3 className="text-sm font-heading text-gray-900 mb-3">
                תקלות ({supplierIssues.length})
              </h3>
              {supplierIssues.length === 0 ? (
                <p className="text-sm font-body text-gray-400">
                  אין תקלות לספק זה
                </p>
              ) : (
                <div className="space-y-2">
                  {supplierIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href="/issues"
                      onClick={onClose}
                      className="block bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-gray-900">
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
                        <p className="text-xs font-body text-gray-500 mt-1 line-clamp-1">
                          {issue.problem_description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs font-body text-gray-400 pt-2 border-t border-gray-100">
              <p>
                נוצר:{" "}
                {new Date(supplier.created_at).toLocaleDateString("he-IL")}
              </p>
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
