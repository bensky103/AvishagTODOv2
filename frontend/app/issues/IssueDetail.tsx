"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useIssue,
  useResolveIssue,
  useReopenIssue,
  useAddActionItem,
  useToggleActionItem,
} from "@/lib/queries/issues";
import { useSupplier } from "@/lib/queries/suppliers";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface IssueDetailProps {
  issueId: number | null;
  onClose: () => void;
}

export default function IssueDetail({ issueId, onClose }: IssueDetailProps) {
  const { data: issue, isLoading } = useIssue(issueId!);
  const { data: supplier } = useSupplier(issue?.supplier_id!);
  const resolveIssue = useResolveIssue();
  const reopenIssue = useReopenIssue();
  const addActionItem = useAddActionItem();
  const toggleActionItem = useToggleActionItem();
  const { toast } = useToast();

  const [newAction, setNewAction] = useState("");
  const [createAsTask, setCreateAsTask] = useState(false);

  if (!issueId) return null;

  const handleResolve = () => {
    resolveIssue.mutate(issueId, {
      onSuccess: () => toast("התקלה סומנה כנפתרה", "success"),
      onError: () => toast("שגיאה בעדכון התקלה", "error"),
    });
  };

  const handleReopen = () => {
    reopenIssue.mutate(issueId, {
      onSuccess: () => toast("התקלה נפתחה מחדש", "success"),
      onError: () => toast("שגיאה בעדכון התקלה", "error"),
    });
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;

    addActionItem.mutate(
      {
        issueId,
        data: {
          description: newAction.trim(),
          create_task: createAsTask,
        },
      },
      {
        onSuccess: () => {
          toast("פעולה נוספה בהצלחה", "success");
          setNewAction("");
          setCreateAsTask(false);
        },
        onError: () => toast("שגיאה בהוספת הפעולה", "error"),
      }
    );
  };

  const handleToggleAction = (actionItem: any) => {
    toggleActionItem.mutate(
      { id: actionItem.id, isCompleted: actionItem.is_completed },
      {
        onError: () => toast("שגיאה בעדכון הפעולה", "error"),
      }
    );
  };

  const completedCount =
    issue?.action_items?.filter((a) => a.is_completed).length ?? 0;
  const totalCount = issue?.action_items?.length ?? 0;

  return (
    <Modal
      isOpen={!!issueId}
      onClose={onClose}
      title={issue?.product_name || "טוען..."}
    >
      {isLoading || !issue ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-400 font-body">טוען...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Issue Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-gray-900">פרטי תקלה</h2>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-body text-gray-500">ספק</p>
                <p className="text-sm font-body text-gray-900">
                  {supplier?.name || "טוען..."}
                </p>
              </div>
              <div>
                <p className="text-xs font-body text-gray-500">תאריך הגעה</p>
                <p className="text-sm font-body text-gray-900">
                  {new Date(issue.arrival_date).toLocaleDateString("he-IL")}
                </p>
              </div>
              {issue.sku && (
                <div>
                  <p className="text-xs font-body text-gray-500">מק״ט</p>
                  <p className="text-sm font-body text-gray-900">{issue.sku}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-body text-gray-500 mb-1">
                תיאור הבעיה
              </p>
              <p className="text-sm font-body text-gray-700 leading-relaxed">
                {issue.problem_description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {issue.status !== "resolved" ? (
              <button
                onClick={handleResolve}
                disabled={resolveIssue.isPending}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {resolveIssue.isPending ? "מעדכן..." : "סימון כנפתרה"}
              </button>
            ) : (
              <button
                onClick={handleReopen}
                disabled={reopenIssue.isPending}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                {reopenIssue.isPending ? "מעדכן..." : "פתיחה מחדש"}
              </button>
            )}
          </div>

          {/* Action Items */}
          <div className="border-t border-gray-100 pt-3">
            <h3 className="font-heading text-gray-900 mb-3">
              פעולות ({completedCount}/{totalCount})
            </h3>

            {totalCount === 0 ? (
              <p className="text-sm font-body text-gray-400 mb-4">
                אין פעולות עדיין
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {issue.action_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleAction(item)}
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs transition-colors ${
                        item.is_completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-sky-500"
                      }`}
                    >
                      {item.is_completed && "✓"}
                    </button>
                    <div className="flex-1">
                      <span
                        className={`font-body text-sm ${
                          item.is_completed
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {item.description}
                      </span>
                      {item.task_id && (
                        <Link
                          href={`/tasks?selected=${item.task_id}`}
                          onClick={onClose}
                          className="block text-xs text-sky-500 hover:underline font-body mt-1"
                        >
                          משימה מקושרת →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Action Item Form */}
            <form
              onSubmit={handleAddAction}
              className="border-t border-gray-100 pt-3 space-y-3"
            >
              <p className="text-sm font-heading text-gray-700">הוסף פעולה</p>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="תיאור הפעולה..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAsTask}
                    onChange={(e) => setCreateAsTask(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs font-body text-gray-600">
                    צור גם כמשימה
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!newAction.trim() || addActionItem.isPending}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-body font-medium rounded-xl transition-colors text-sm"
                >
                  {addActionItem.isPending ? "מוסיף..." : "הוסף"}
                </button>
              </div>
            </form>
          </div>

          {/* Metadata */}
          <div className="text-xs font-body text-gray-400 space-y-1 border-t border-gray-100 pt-3">
            <p>
              נוצר: {new Date(issue.created_at).toLocaleDateString("he-IL")}
            </p>
            {issue.resolved_at && (
              <p>
                נפתר:{" "}
                {new Date(issue.resolved_at).toLocaleDateString("he-IL")}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
