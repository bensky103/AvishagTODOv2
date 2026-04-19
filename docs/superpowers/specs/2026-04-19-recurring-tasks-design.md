# Recurring Monthly Tasks — Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope item:** Customer TODO — *"להוסיף משימה חודשית חוזרת (עוד טאב תחת משימות) - אפשר לקרוא לזה משימות קבועות"*

## Goal

Let Avishag mark a task as **monthly recurring** (משימה קבועה). When she marks such a task complete, instead of closing it the system advances its `due_date` by one month and keeps it `open`. A new chip row on `/tasks` lets her filter to just the recurring tasks (קבועות), and a small indicator on the task card makes them visually distinct.

## Decisions locked

- **Recurrence semantics: advance-in-place.** No history of past completions, no new row created. Simpler. Upgradable later to spawn-on-complete if she asks.
- **UI placement: third filter chip row** under the existing category and status rows, orthogonal — so she can combine *recurring* with *category* filters.
- **Required field:** `is_recurring_monthly=True` requires a `due_date` (same rule the reminder field uses). Enforced in the service layer + UI.

## Non-goals

- Weekly / yearly / custom recurrence — monthly only.
- Completion history for recurring tasks.
- Cron-driven auto-generation of next-month instances (we advance on completion, not on a schedule).
- Separate sidebar entry for recurring tasks (it's a filter, not a new page).

## Data model

### Migration

`backend/alembic/versions/0006_add_task_recurring.py`:

```python
def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("is_recurring_monthly", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_tasks_is_recurring_monthly", "tasks", ["is_recurring_monthly"])

def downgrade() -> None:
    op.drop_index("ix_tasks_is_recurring_monthly", table_name="tasks")
    op.drop_column("tasks", "is_recurring_monthly")
```

### Model

`backend/app/models/task.py`:

```python
is_recurring_monthly: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
```

### Schemas

`backend/app/schemas/task.py`:
- `TaskCreate`: `is_recurring_monthly: bool = False`
- `TaskUpdate`: `is_recurring_monthly: bool | None = None`
- `TaskResponse`: `is_recurring_monthly: bool`

### Validation (service layer)

Same pattern `reminder_enabled` already uses (validate-before-mutate):

- `create_task` — reject with 422 Hebrew detail `"לא ניתן להגדיר משימה קבועה ללא תאריך יעד"` when `is_recurring_monthly=True` and `due_date` is None.
- `update_task` — same rule using the effective (incoming ∪ current) values so clearing `due_date` on a recurring task is also rejected.

## Advance-in-place logic

New helper in `backend/app/services/task_service.py`:

```python
import calendar
from datetime import date

def _add_one_month(d: date) -> date:
    new_month = d.month + 1
    new_year = d.year
    if new_month > 12:
        new_month = 1
        new_year += 1
    last_day = calendar.monthrange(new_year, new_month)[1]
    return date(new_year, new_month, min(d.day, last_day))
```

Modify `toggle_task_completion` (or the equivalent existing path that flips `is_completed`):

- If the task is being **marked complete** AND `is_recurring_monthly=True` AND `due_date` is not None:
  - **Do not** set `is_completed=True`.
  - Set `due_date = _add_one_month(task.due_date)`.
  - Keep `is_completed=False`.
  - Return the task as still-open with the bumped date.
- Otherwise — preserve the existing toggle behavior (flip `is_completed`).
- When reopening a completed task, no special handling needed (standard toggle path).

**Month-boundary handling:** a recurring task due Jan 31 advances to Feb 28 (or 29 in a leap year), then March 31, then April 30, etc. `calendar.monthrange` gives us the correct last-day-of-month.

## Frontend

### Types & queries

- `frontend/lib/types.ts` — `Task`/`TaskCreate`/`TaskUpdate` gain `is_recurring_monthly: boolean`.
- `frontend/lib/queries/tasks.ts` — no change; the generic filter record already accepts the backend's `is_recurring_monthly` query-string param.

### API — new filter param

`GET /api/tasks` accepts `is_recurring_monthly=true|false` (optional). Service translates to a `WHERE` clause if present.

### Tasks page

`frontend/app/tasks/page.tsx` adds a third `FilterChips` row below the status row:

```tsx
const recurringOptions = [
  { value: "all", label: "הכל" },
  { value: "regular", label: "רגילות" },
  { value: "recurring", label: "⏰ קבועות" },
];
```

- URL param `?recurring=all|regular|recurring`. Default `all`.
- Passed as `is_recurring_monthly=true|false` to the query when `regular` or `recurring` is selected; omitted when `all`.
- Container `<div className="flex flex-col gap-2">` now holds three rows (was two after the last fix).

### Task form

`frontend/app/tasks/TaskForm.tsx` — add a new `Switch` field **below** the reminder toggle (they share the "needs-due-date" gating, so visually grouping them makes sense):

```
⏰ משימה חודשית חוזרת     [ toggle ]
כל חודש ביום היעד תוחזר אוטומטית
```

- Toggle disabled when `dueDate === ""`; helper text switches to muted *"בחר תאריך יעד כדי להגדיר משימה חוזרת"*.
- `useEffect`: if `dueDate` transitions to `""` while `recurring` is on, auto-flip to `false`.
- Submit payload includes `is_recurring_monthly`.

### Task card

`frontend/components/ui/TaskCard.tsx` — render a small ⏰ icon (or a "קבועה" chip) in the metadata row when `task.is_recurring_monthly === true`. Place it next to the existing 🔔 reminder badge.

## Bot agent integration

`backend/app/agent/tools.py`:

- `create_task` tool: add optional `is_recurring_monthly: bool = False` kwarg. When true and no `due_date` is provided, agent asks for the due date before creating.
- New tool `toggle_task_recurring(task_name: str, enabled: bool) -> str`:
  - Fuzzy-match task by name.
  - If `enabled=True` and task has no `due_date`, return the Hebrew error without mutating.
  - Otherwise update and return Hebrew confirmation (*"משימה X סומנה כקבועה"* / *"משימה X כבר אינה קבועה"*).

`backend/app/agent/prompts.py` — add a one-sentence note that the agent should understand *"משימה קבועה"* / *"חוזרת"* / *"כל חודש"* as this field.

## Edge cases

| Case | Behavior |
|---|---|
| Mark recurring task complete | `due_date += 1 month`, remains open. `is_completed` stays `False` |
| Recurring task with `due_date = Jan 31`, completed | Next due becomes `Feb 28` (or 29 in leap year) |
| Recurring task with `due_date = Dec 15`, completed | Next due becomes `Jan 15` of next year |
| `is_recurring_monthly=True` + no `due_date` | API returns 422; UI toggle disabled |
| User clears `due_date` on a recurring task | FE auto-flips toggle off; BE rejects PATCH with 422 if `is_recurring_monthly` stays `True` |
| Reopen a recurring task from "completed" status | Standard toggle — clears `is_completed`. Does NOT touch `due_date`. (Note: this is unreachable in normal flow since completing a recurring task doesn't set `is_completed=True` — but the backend handles it gracefully if the row somehow ends up completed.) |
| Reminder + recurring combined on one task | Both work independently. Daily 9 AM digest shows the task on each month's due date |

## Tests

**`backend/tests/test_task_recurring.py`:**
- POST with `is_recurring_monthly=True, due_date=None` → 422 with Hebrew detail.
- PATCH clearing `due_date` on a recurring task → 422.
- POST with `is_recurring_monthly=True` + valid `due_date` → 200; GET echoes `is_recurring_monthly=True`.
- Filter: `GET /api/tasks?is_recurring_monthly=true` returns only recurring rows.
- Toggle-complete on recurring task with `due_date=2026-05-15`: row stays `is_completed=False`, `due_date=2026-06-15`.
- Toggle-complete on recurring task with `due_date=2026-01-31`: `due_date=2026-02-28`.
- Toggle-complete on recurring task with `due_date=2024-01-31` (leap year): `due_date=2024-02-29`.
- Toggle-complete on recurring task with `due_date=2026-12-15`: `due_date=2027-01-15`.
- Toggle-complete on NON-recurring task: standard behavior (flips `is_completed`), `due_date` unchanged.

**`backend/tests/test_agent_recurring_tool.py`:**
- `toggle_task_recurring("...", True)` on task with `due_date` → persists `True`.
- Same call on task without `due_date` → Hebrew error, row unchanged.
- `toggle_task_recurring("...", False)` → persists `False`, `due_date` unchanged.

## Files touched

**Backend**
- `backend/alembic/versions/0006_add_task_recurring.py` (new)
- `backend/app/models/task.py`
- `backend/app/schemas/task.py`
- `backend/app/services/task_service.py` (validation + advance-in-place + filter)
- `backend/app/api/tasks.py` (filter param)
- `backend/app/agent/tools.py` (new tool + create_task kwarg)
- `backend/app/agent/prompts.py`
- `backend/tests/test_task_recurring.py` (new)
- `backend/tests/test_agent_recurring_tool.py` (new)

**Frontend**
- `frontend/lib/types.ts`
- `frontend/app/tasks/page.tsx` (third chip row)
- `frontend/app/tasks/TaskForm.tsx` (recurring toggle)
- `frontend/components/ui/TaskCard.tsx` (⏰ indicator)
