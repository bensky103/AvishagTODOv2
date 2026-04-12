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
    <div className="min-h-screen">
      <PageHeader title="ספקים" />

      <div className="max-w-5xl mx-auto p-4 md:p-6 -mt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש ספק..."
            className="w-full bg-white rounded-xl shadow-card pr-11 pl-4 py-3 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border border-gray-100 transition-shadow"
          />
        </div>

        {/* Supplier List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-text-secondary font-body text-sm">אין ספקים</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered?.map((supplier) => {
              const openCount = openIssueCounts[supplier.id] || 0;
              return (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className="w-full bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center justify-between hover:shadow-card-hover transition-all duration-200 text-right group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <span className="text-indigo-600 font-heading text-sm">
                        {supplier.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-gray-900 text-sm">
                        {supplier.name}
                      </p>
                      {supplier.contact_info && (
                        <p className="text-xs font-body text-text-secondary mt-0.5 truncate">
                          {supplier.contact_info}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mr-3">
                    {openCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-600 ring-1 ring-red-100">
                        {openCount} תקלות
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        תקין
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-gray-400 transition-colors">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
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
