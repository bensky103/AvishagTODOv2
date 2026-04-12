"use client";

import { useState } from "react";
import { useIssues } from "@/lib/queries/issues";
import { useSuppliers } from "@/lib/queries/suppliers";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterChips } from "@/components/ui/FilterChips";
import { Badge } from "@/components/ui/Badge";
import { FAB } from "@/components/ui/FAB";
import IssueForm from "./IssueForm";
import IssueDetail from "./IssueDetail";

type StatusFilter = "open" | "in_progress" | "resolved";

const filterOptions = [
  { value: "open" as const, label: "פתוחות" },
  { value: "in_progress" as const, label: "בטיפול" },
  { value: "resolved" as const, label: "נפתרו" },
];

export default function IssuesPage() {
  const [filter, setFilter] = useState<StatusFilter>("open");
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
      <PageHeader title="תקלות">
        <FilterChips
          options={filterOptions}
          selected={filter}
          onChange={(val) => setFilter(val as StatusFilter)}
          variant="header"
        />
      </PageHeader>

      <div className="max-w-5xl mx-auto p-4 md:p-6 -mt-4 space-y-2.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : issues?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-text-secondary font-body text-sm">אין תקלות</p>
          </div>
        ) : (
          issues?.map((issue) => {
            const completedActions =
              issue.action_items?.filter((a) => a.is_completed).length ?? 0;
            const totalActions = issue.action_items?.length ?? 0;

            return (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="block w-full text-right bg-white rounded-xl border border-gray-100 shadow-card p-4 hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-gray-900 text-sm">
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
                  <p className="text-xs font-body text-gray-600 mt-2 line-clamp-2">
                    {issue.problem_description}
                  </p>
                )}

                {totalActions > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full transition-all duration-300"
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

      <FAB onClick={() => setShowCreate(true)} />

      <IssueForm isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <IssueDetail
        issueId={selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
      />
    </div>
  );
}
