"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useIssue,
  useResolveIssue,
  useReopenIssue,
  useAddActionItem,
  useToggleActionItem,
  useDeleteIssue,
} from "@/lib/queries/issues";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface IssueDetailProps {
  issueId: number | null;
  onClose: () => void;
}

export default function IssueDetail({ issueId, onClose }: IssueDetailProps) {
  const { data: issue, isLoading } = useIssue(issueId);
  const resolveIssue = useResolveIssue();
  const reopenIssue = useReopenIssue();
  const addActionItem = useAddActionItem();
  const toggleActionItem = useToggleActionItem();
  const deleteIssue = useDeleteIssue();
  const { toast } = useToast();

  const [newAction, setNewAction] = useState("");
  const [createAsTask, setCreateAsTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!issueId) return null;

  const handleResolve = () => {
    resolveIssue.mutate(issueId, {
      onSuccess: () => toast("הבעיה סומנה כנפתרה", "success"),
      onError: () => toast("שגיאה בעדכון הבעיה", "error"),
    });
  };

  const handleReopen = () => {
    reopenIssue.mutate(issueId, {
      onSuccess: () => toast("הבעיה נפתחה מחדש", "success"),
      onError: () => toast("שגיאה בעדכון הבעיה", "error"),
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
      { id: actionItem.id, isCompleted: actionItem.is_completed, issueId: issueId! },
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
          <p className="text-text-secondary font-body">טוען...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Issue Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-text-primary">פרטי בעיית איכות</h2>
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
                <p className="text-xs font-body text-text-secondary">ספק</p>
                <p className="text-sm font-body text-text-primary">
                  {issue.supplier_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-body text-text-secondary">תאריך הגעה</p>
                <p className="text-sm font-body text-text-primary">
                  {new Date(issue.arrival_date).toLocaleDateString("he-IL")}
                </p>
              </div>
              {issue.sku && (
                <div>
                  <p className="text-xs font-body text-text-secondary">מק״ט</p>
                  <p className="text-sm font-body text-text-primary">{issue.sku}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-body text-text-secondary mb-1">
                תיאור הבעיה
              </p>
              <p className="text-sm font-body text-gray-300 leading-relaxed">
                {issue.problem_description}
              </p>
            </div>

            {issue.order_number && (
              <div>
                <p className="text-xs font-body text-text-secondary mb-1">מספר הזמנה</p>
                <p className="text-sm font-body text-text-primary">{issue.order_number}</p>
              </div>
            )}

            {issue.what_we_did && (
              <div>
                <p className="text-xs font-body text-text-secondary mb-1">מה עשינו</p>
                <p className="text-sm font-body text-gray-300 leading-relaxed">{issue.what_we_did}</p>
              </div>
            )}

            {issue.compensation_required && (
              <div>
                <p className="text-xs font-body text-text-secondary mb-1">פיצוי נדרש</p>
                <p className="text-sm font-body text-text-primary">{issue.compensation_required}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {issue.status !== "resolved" ? (
              <button
                onClick={handleResolve}
                disabled={resolveIssue.isPending}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {resolveIssue.isPending ? "מעדכן..." : "סימון כנפתרה"}
              </button>
            ) : (
              <button
                onClick={handleReopen}
                disabled={reopenIssue.isPending}
                className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                {reopenIssue.isPending ? "מעדכן..." : "פתיחה מחדש"}
              </button>
            )}
          </div>

          {/* Action Items */}
          <div className="border-t border-white/[0.05] pt-3">
            <h3 className="font-heading text-text-primary mb-3">
              פעולות ({completedCount}/{totalCount})
            </h3>

            {totalCount === 0 ? (
              <p className="text-sm font-body text-text-secondary mb-4">
                אין פעולות עדיין
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {issue.action_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <button
                      onClick={() => handleToggleAction(item)}
                      className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs transition-colors ${
                        item.is_completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-600 hover:border-emerald-400"
                      }`}
                    >
                      {item.is_completed && "✓"}
                    </button>
                    <div className="flex-1">
                      <span
                        className={`font-body text-sm ${
                          item.is_completed
                            ? "line-through text-gray-500"
                            : "text-text-primary"
                        }`}
                      >
                        {item.description}
                      </span>
                      {item.task_id && (
                        <Link
                          href={`/tasks?selected=${item.task_id}`}
                          onClick={onClose}
                          className="block text-xs text-emerald-400 hover:underline font-body mt-1"
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
              className="border-t border-white/[0.05] pt-3 space-y-3"
            >
              <p className="text-sm font-heading text-text-secondary">הוסף פעולה</p>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="תיאור הפעולה..."
                className="w-full bg-surface-raised border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm font-body text-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAsTask}
                    onChange={(e) => setCreateAsTask(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-surface-raised"
                  />
                  <span className="text-xs font-body text-text-secondary">
                    צור גם כמשימה
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!newAction.trim() || addActionItem.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-body font-medium rounded-xl transition-colors text-sm"
                >
                  {addActionItem.isPending ? "מוסיף..." : "הוסף"}
                </button>
              </div>
            </form>
          </div>

          {/* Metadata */}
          <div className="text-xs font-body text-text-secondary space-y-1 border-t border-white/[0.05] pt-3">
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

          {/* Delete */}
          <div className="pt-1">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 rounded-xl font-body text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                מחיקת בעיה
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    deleteIssue.mutate(issue.id, {
                      onSuccess: () => { toast("הבעיה נמחקה", "success"); onClose(); },
                      onError: (err: Error) => toast(err.message || "שגיאה במחיקה", "error"),
                    });
                  }}
                  disabled={deleteIssue.isPending}
                  className="flex-1 py-2.5 rounded-xl font-body font-medium text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  {deleteIssue.isPending ? "מוחק..." : "אישור מחיקה"}
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
  );
}
