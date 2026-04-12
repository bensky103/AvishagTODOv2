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
    <div className="min-h-screen bg-slate-50">
      <PageHeader title="תקלות">
        <FilterChips
          options={filterOptions}
          selected={filter}
          onChange={(val) => setFilter(val as StatusFilter)}
          variant="header"
        />
      </PageHeader>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body">טוען...</p>
          </div>
        ) : issues?.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 font-body text-sm">אין תקלות</p>
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
                className="block w-full text-right bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-gray-900 text-sm">
                      {issue.product_name}
                    </p>
                    <p className="text-xs font-body text-gray-500 mt-1">
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
                  <p className="text-xs font-body text-gray-400 mt-2">
                    📋 {totalActions} פעולות · {completedActions} הושלמו
                  </p>
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
