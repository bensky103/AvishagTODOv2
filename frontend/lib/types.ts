export type Urgency = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "in_progress" | "resolved";
import type { TaskCategory } from "./taskCategories";
export type { TaskCategory };

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  urgency: Urgency;
  is_completed: boolean;
  reminder_enabled: boolean;
  is_recurring_monthly: boolean;
  category: TaskCategory;
  created_at: string;
  completed_at: string | null;
}

export interface ActionItem {
  id: number;
  issue_report_id: number;
  task_id: number | null;
  description: string;
  is_completed: boolean;
  created_at: string;
}

export interface IssueReport {
  id: number;
  supplier_name: string;
  product_name: string;
  sku: string | null;
  arrival_date: string;
  problem_description: string;
  status: IssueStatus;
  order_number: string | null;
  what_we_did: string | null;
  compensation_required: string | null;
  created_at: string;
  resolved_at: string | null;
  action_items: ActionItem[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
  reminder_enabled?: boolean;
  is_recurring_monthly?: boolean;
  category?: TaskCategory;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  urgency?: Urgency;
  reminder_enabled?: boolean;
  is_recurring_monthly?: boolean;
  category?: TaskCategory;
}

export interface IssueCreate {
  supplier_name: string;
  product_name: string;
  sku?: string;
  arrival_date: string;
  problem_description: string;
  order_number?: string;
  what_we_did?: string;
  compensation_required?: string;
}

export interface IssueUpdate {
  product_name?: string;
  sku?: string;
  problem_description?: string;
  status?: IssueStatus;
  order_number?: string;
  what_we_did?: string;
  compensation_required?: string;
}

export interface ActionItemCreate {
  description: string;
  create_task?: boolean;
}
