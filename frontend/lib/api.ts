import type {
  Task,
  TaskCreate,
  TaskUpdate,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  IssueReport,
  IssueCreate,
  IssueUpdate,
  ActionItem,
  ActionItemCreate,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...options?.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });

  if (res.status === 401 && typeof window !== "undefined") {
    // Cookie expired or invalid — clear auth state
    document.cookie = "auth_token=; max-age=0; path=/";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail || res.statusText;
    throw new Error(detail);
  }

  return res.json();
}

export const tasks = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<Task[]>(`/tasks/${qs}`);
  },
  get: (id: number) => request<Task>(`/tasks/${id}`),
  create: (data: TaskCreate) =>
    request<Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: TaskUpdate) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  complete: (id: number) =>
    request<Task>(`/tasks/${id}/complete`, { method: "POST" }),
  reopen: (id: number) =>
    request<Task>(`/tasks/${id}/reopen`, { method: "POST" }),
  delete: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export const suppliers = {
  list: () => request<Supplier[]>("/suppliers/"),
  get: (id: number) => request<Supplier>(`/suppliers/${id}`),
  create: (data: SupplierCreate) =>
    request<Supplier>("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: SupplierUpdate) =>
    request<Supplier>(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/suppliers/${id}`, { method: "DELETE" }),
};

export const issues = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<IssueReport[]>(`/issues/${qs}`);
  },
  get: (id: number) => request<IssueReport>(`/issues/${id}`),
  create: (data: IssueCreate) =>
    request<IssueReport>("/issues/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: IssueUpdate) =>
    request<IssueReport>(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resolve: (id: number) =>
    request<IssueReport>(`/issues/${id}/resolve`, { method: "POST" }),
  reopen: (id: number) =>
    request<IssueReport>(`/issues/${id}/reopen`, { method: "POST" }),
  addActionItem: (issueId: number, data: ActionItemCreate) =>
    request<ActionItem>(`/issues/${issueId}/action-items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  completeActionItem: (actionItemId: number) =>
    request<ActionItem>(`/issues/action-items/${actionItemId}/complete`, { method: "POST" }),
  uncompleteActionItem: (actionItemId: number) =>
    request<ActionItem>(`/issues/action-items/${actionItemId}/uncomplete`, { method: "POST" }),
  delete: (id: number) => request<void>(`/issues/${id}`, { method: "DELETE" }),
};
