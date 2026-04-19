"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { ViewToggle, type ViewMode } from "@/components/ui/ViewToggle";
import { Badge } from "@/components/ui/Badge";
import IssueForm from "./IssueForm";
import IssueDetail from "./IssueDetail";
import type { IssueReport } from "@/lib/types";

type StatusFilter = "open" | "in_progress" | "resolved";

const VALID_FILTERS: StatusFilter[] = ["open", "in_progress", "resolved"];

const filterOptions = [
  { value: "open" as const, label: "פתוחות" },
  { value: "in_progress" as const, label: "בטיפול" },
  { value: "resolved" as const, label: "נפתרו" },
];

type SortKey = "arrival_date" | "supplier" | "order_number" | "problem_description" | "what_we_did" | "compensation_required" | "status";

function IssueStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "open" ? "open" : status === "in_progress" ? "in_progress" : "resolved"
      }
    >
      {status === "open" ? "פתוחה" : status === "in_progress" ? "בטיפול" : "נפתרה"}
    </Badge>
  );
}

function TableView({
  issues,
  supplierMap,
  onSelectIssue,
}: {
  issues: IssueReport[];
  supplierMap: Record<number, string>;
  onSelectIssue: (id: number) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("arrival_date");
  const [sortAsc, setSortAsc] = useState(false); // default: newest first (desc)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...issues].sort((a, b) => {
    let aVal: string | null | undefined;
    let bVal: string | null | undefined;

    if (sortKey === "arrival_date") {
      aVal = a.arrival_date;
      bVal = b.arrival_date;
    } else if (sortKey === "supplier") {
      aVal = supplierMap[a.supplier_id] ?? null;
      bVal = supplierMap[b.supplier_id] ?? null;
    } else if (sortKey === "order_number") {
      aVal = a.order_number;
      bVal = b.order_number;
    } else if (sortKey === "problem_description") {
      aVal = a.problem_description;
      bVal = b.problem_description;
    } else if (sortKey === "what_we_did") {
      aVal = a.what_we_did;
      bVal = b.what_we_did;
    } else if (sortKey === "compensation_required") {
      aVal = a.compensation_required;
      bVal = b.compensation_required;
    } else if (sortKey === "status") {
      aVal = a.status;
      bVal = b.status;
    }

    // Nulls sink to the bottom regardless of direction
    if (!aVal && !bVal) return 0;
    if (!aVal) return 1;
    if (!bVal) return -1;

    const cmp = aVal.localeCompare(bVal, "he");
    return sortAsc ? cmp : -cmp;
  });

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => handleSort(col)}
        className="px-3 py-2.5 text-right font-body text-xs font-medium text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors whitespace-nowrap"
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={sortAsc ? "rotate-180" : ""}
              style={{ transition: "transform 0.15s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.05] shadow-card">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="bg-surface border-b border-white/[0.05]">
            <SortHeader col="arrival_date" label="תאריך" />
            <SortHeader col="supplier" label="ספק" />
            <SortHeader col="order_number" label="מס׳ הזמנה" />
            <SortHeader col="problem_description" label="תיאור הבעיה" />
            <SortHeader col="what_we_did" label="מה עשינו" />
            <SortHeader col="compensation_required" label="פיצוי נדרש" />
            <SortHeader col="status" label="סטטוס" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((issue, idx) => (
            <tr
              key={issue.id}
              onClick={() => onSelectIssue(issue.id)}
              className={`cursor-pointer border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors ${
                idx % 2 === 1 ? "bg-white/[0.01]" : ""
              }`}
            >
              <td className="px-3 py-2.5 text-xs font-body text-text-secondary whitespace-nowrap">
                {new Date(issue.arrival_date).toLocaleDateString("he-IL")}
              </td>
              <td className="px-3 py-2.5 text-xs font-body text-text-primary whitespace-nowrap">
                {supplierMap[issue.supplier_id] || "—"}
              </td>
              <td className="px-3 py-2.5 text-xs font-body text-text-primary whitespace-nowrap">
                {issue.order_number || <span className="text-text-secondary">—</span>}
              </td>
              <td className="px-3 py-2.5 text-xs font-body text-text-primary max-w-[180px]">
                <span
                  className="block overflow-hidden text-ellipsis"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {issue.problem_description}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs font-body text-text-secondary max-w-[160px]">
                {issue.what_we_did ? (
                  <span
                    className="block overflow-hidden text-ellipsis"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {issue.what_we_did}
                  </span>
                ) : (
                  <span className="text-text-secondary">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs font-body text-text-primary whitespace-nowrap">
                {issue.compensation_required || <span className="text-text-secondary">—</span>}
              </td>
              <td className="px-3 py-2.5">
                <IssueStatusBadge status={issue.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    }>
      <IssuesPageContent />
    </Suspense>
  );
}

function IssuesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramFilter = searchParams.get("status") as StatusFilter | null;
  const filter: StatusFilter = paramFilter && VALID_FILTERS.includes(paramFilter) ? paramFilter : "open";

  const rawView = searchParams.get("view");
  const view: ViewMode = rawView === "table" ? "table" : "cards";

  const setFilter = useCallback((val: StatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", val);
    router.replace(`?${params.toString()}`);
  }, [searchParams, router]);

  const setView = useCallback((val: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", val);
    router.replace(`?${params.toString()}`);
  }, [searchParams, router]);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const { data: issues, isLoading } = useIssues({ status: filter });
  const { data: suppliers } = useSuppliers();

  const supplierMap: Record<number, string> = {};
  suppliers?.forEach((s) => {
    supplierMap[s.id] = s.name;
  });

  return (
    <div className="min-h-screen">
      <PageHeader title="בעיות איכות">
        <div className="flex items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <FilterChips
            options={filterOptions}
            selected={filter}
            onChange={(val) => setFilter(val as StatusFilter)}
            variant="header"
          />
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto p-4 md:p-6 -mt-4 space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : issues?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(20,168,122,0.08)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14a87a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-text-secondary font-body text-sm">אין בעיות איכות</p>
          </div>
        ) : view === "table" ? (
          <TableView
            issues={issues ?? []}
            supplierMap={supplierMap}
            onSelectIssue={setSelectedIssueId}
          />
        ) : (
          issues?.map((issue) => {
            const completedActions =
              issue.action_items?.filter((a) => a.is_completed).length ?? 0;
            const totalActions = issue.action_items?.length ?? 0;

            return (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="block w-full text-right bg-surface rounded-xl border border-white/[0.05] shadow-card p-4 hover:shadow-card-hover hover:border-white/[0.08] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-text-primary text-sm">
                      {issue.product_name}
                    </p>
                    <p className="text-xs font-body text-text-secondary mt-1">
                      {supplierMap[issue.supplier_id] || "ספק לא ידוע"} ·{" "}
                      {new Date(issue.arrival_date).toLocaleDateString("he-IL")}
                    </p>
                  </div>
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
                  <p className="text-xs font-body text-text-secondary mt-2 line-clamp-2">
                    {issue.problem_description}
                  </p>
                )}

                {totalActions > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-body text-text-secondary flex-shrink-0">
                      {completedActions}/{totalActions}
                    </span>
                  </div>
                )}
              </button>
            );
          })
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
        הוסף בעיה
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <IssueForm isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <IssueDetail
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </div>
  );
}
