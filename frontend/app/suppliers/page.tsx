"use client";

import { useState } from "react";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useIssues } from "@/lib/queries/issues";
import { PageHeader } from "@/components/layout/PageHeader";
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
            className="w-full bg-surface rounded-xl shadow-card pr-11 pl-4 py-3 text-sm font-body text-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border border-white/[0.05] transition-shadow"
          />
        </div>

        {/* Supplier List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(20,168,122,0.08)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14a87a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                  className="w-full bg-surface rounded-xl border border-white/[0.05] shadow-card p-4 flex items-center justify-between hover:shadow-card-hover hover:border-white/[0.08] transition-all duration-200 text-right group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: "rgba(20,168,122,0.1)" }}>
                      <span className="text-emerald-400 font-heading text-sm">
                        {supplier.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-text-primary text-sm">
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                        {openCount} בעיות
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                        תקין
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-gray-400 transition-colors">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 md:bottom-8 left-6 z-50 rounded-2xl text-white shadow-lg
          flex items-center gap-2 px-5 py-3 hover:shadow-xl active:scale-95 transition-all duration-200 font-body font-medium text-sm"
        style={{
          background: "linear-gradient(135deg, #14a87a, #0d8c63)",
          boxShadow: "0 4px 14px rgba(20,168,122,0.35)",
        }}
      >
        הוסף ספק
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <SupplierForm isOpen={showCreate} onClose={() => setShowCreate(false)} />

      <SupplierDetail
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </div>
  );
}
