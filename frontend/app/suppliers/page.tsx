"use client";

import { useState } from "react";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { PageHeader } from "@/components/layout/PageHeader";
import { FAB } from "@/components/ui/FAB";
import SupplierForm from "./SupplierForm";
import SupplierDetail from "./SupplierDetail";

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const { data: issues } = useIssues();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  // Count open issues per supplier
  const openIssueCounts: Record<number, number> = {};
  issues
    ?.filter((i) => i.status !== "resolved")
    .forEach((i) => {
      openIssueCounts[i.supplier_id] =
        (openIssueCounts[i.supplier_id] || 0) + 1;
    });

  const filtered = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader title="ספקים" />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש ספק..."
            className="w-full bg-white rounded-xl shadow-sm pr-10 pl-4 py-3 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-100"
          />
        </div>

        {/* Supplier List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body">טוען...</p>
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body text-sm">אין ספקים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered?.map((supplier) => {
              const openCount = openIssueCounts[supplier.id] || 0;
              return (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow text-right"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-gray-900">
                      {supplier.name}
                    </p>
                    {supplier.contact_info && (
                      <p className="text-xs font-body text-gray-500 mt-1 truncate">
                        {supplier.contact_info}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mr-4">
                    {openCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-red-100 text-red-700">
                        {openCount} תקלות
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-green-100 text-green-700">
                        תקין
                      </span>
                    )}
                    <span className="text-gray-300 text-lg">&#x2039;</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FAB onClick={() => setShowCreate(true)} />

      <SupplierForm isOpen={showCreate} onClose={() => setShowCreate(false)} />

      <SupplierDetail
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </div>
  );
}
