# Task Categories ("3 Hats") — Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope item:** TODO.md item #3 first half — *"משימות פתוחות אני צריכה ל - 3 כובעים: עבודה / ועד בית / אישי"*

## Goal

Let Avishag split her task list into three "hats" (categories) and quickly see + navigate to each one: **עבודה** (work), **ועד בית** (building committee), **אישי** (personal).

## Scope

- Per-task `category` field (required, one of three values).
- `/tasks` page filter chips let her narrow the list to one category at a time.
- Desktop sidebar: the "משימות" entry becomes an expandable group; clicking the chevron reveals 3 sub-items, each showing the count of open tasks in that category. Clicking a sub-item navigates to the filtered list.
- Bot agent: when creating or updating a task, the bot asks for / accepts a category, mirroring how it already handles urgency.

## Non-goals

- Three separate tab pages per category — we do **one** page with filter chips instead, per explicit decision.
- Per-category settings (colors, icons beyond what's described here).
- Hierarchical / nested categories.
- Changing the existing urgency system.
- Mobile-specific sub-nav in `BottomNav` — the mobile filter chips on `/tasks` cover that surface.

## Data model

### Migration

New Alembic revision `backend/alembic/versions/<rev>_add_task_category.py`:

```python
def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "category",
            sa.Enum("work", "vaad", "personal", name="task_category_enum"),
            nullable=False,
            server_default="work",
        ),
    )
    op.create_index("ix_tasks_category", "tasks", ["category"])


def downgrade() -> None:
    op.drop_index("ix_tasks_category", table_name="tasks")
    op.drop_column("tasks", "category")
    op.execute("DROP TYPE IF EXISTS task_category_enum")
```

Existing rows backfill to `work` — that matches the purchasing-app origin of this project and matches what's in today's task list.

### Model

`backend/app/models/task.py`:

```python
category: Mapped[str] = mapped_column(
    Enum("work", "vaad", "personal", name="task_category_enum"),
    default="work",
    index=True,
)
```

### Schemas

`backend/app/schemas/task.py`:
- `TaskCreate`: add `category: Literal["work", "vaad", "personal"] = "work"`
- `TaskUpdate`: add `category: Literal["work", "vaad", "personal"] | None = None`
- `TaskRead`: add `category: Literal["work", "vaad", "personal"]`

Storage is English slugs; Hebrew display labels live in the frontend theme map below — never persisted.

## Frontend

### Shared label map

`frontend/lib/taskCategories.ts` (new) — single source of truth so both the page and sidebar read the same labels:

```ts
export const TASK_CATEGORIES = [
  { value: "work",     label: "עבודה",    icon: "💼" },
  { value: "vaad",     label: "ועד בית",   icon: "🏠" },
  { value: "personal", label: "אישי",     icon: "👤" },
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number]["value"];
```

### Types + queries

- `frontend/lib/types.ts`: `Task` gains `category: TaskCategory`.
- `frontend/lib/queries/tasks.ts`: `CreateTaskInput` / `UpdateTaskInput` accept `category?: TaskCategory`. `useTasks` accepts an optional `category` filter that becomes a `?category=` query-string param on the `/api/tasks` GET.
- Backend `GET /api/tasks` accepts `category` as a filter alongside the existing `status` param.

### Tasks page

`frontend/app/tasks/page.tsx`:

- Add a **second** `FilterChips` row above the existing status row, options:
  `[{value: "all", label: "הכל"}, ...TASK_CATEGORIES]`
- Combine both filters in the query call: `useTasks({ status, category })`.
- Category filter syncs to URL param `?category=work|vaad|personal|all` (matches how `/issues` already handles its status param) so the sidebar sub-items can deep-link.
- Existing `openCount` badge in the header header text stays the count *within* the current category filter, which matches how people naturally read the page.

### Task form

`frontend/app/tasks/TaskForm.tsx` gains a `Select` right below "שם המשימה" (before description so it feels like the primary grouping choice, not a secondary attribute):

```
┌──────────────────────┐
│ שם המשימה *          │
│ [ ... ]              │
├──────────────────────┤
│ קטגוריה *            │
│ [ עבודה         ▾ ]  │  ← options from TASK_CATEGORIES
├──────────────────────┤
│ תיאור                │
...
```

Default to `work` on create. On edit, pre-fill from the task.

### Task card

`frontend/components/ui/TaskCard.tsx` — add a small category chip (icon + label) next to the urgency indicator. Subtle; uses the same surface-raised styling as existing metadata.

### Sidebar — expandable "משימות" group

`frontend/components/layout/Shell.tsx` — replace the current flat `NavItem` for `/tasks` with an `ExpandableNavGroup`:

```
▾ משימות                 (8)
    💼 עבודה             (5)
    🏠 ועד בית            (2)
    👤 אישי               (1)
```

- Chevron on the parent toggles expanded state. Default: **expanded**.
- Expanded state persists in `localStorage` under `sidebar_tasks_expanded` so she doesn't have to re-expand every page load.
- Parent click navigates to `/tasks` (no category filter).
- Sub-item click navigates to `/tasks?category=<slug>`.
- Active styling: parent highlights if the current path is `/tasks` regardless of category; the matching sub-item highlights too when a category is selected.
- Counts: `tasks.filter(t => !t.is_completed && t.category === value).length` for each sub-item. Parent badge keeps its existing total-open count.
- When sidebar is collapsed (narrow mode), the group collapses into just the parent icon — sub-items hide. No popover, no fly-out menu (keeps the collapse mode simple).

### Mobile (`BottomNav`)

No change. The mobile view relies on the filter chip row at the top of `/tasks` for category switching. The bottom-nav "משימות" icon still opens the `/tasks` page with `?category=all` (or last used — see below).

### URL param as source of truth

`/tasks?category=<slug>` drives the selected category chip + the query. This means:
- Sidebar sub-items are plain `<Link>`s, not stateful buttons.
- Refresh preserves the view.
- "Open in new tab" works as expected.

Same pattern as `/issues?status=open` already uses.

## Bot agent integration

`backend/app/agent/tools.py`:
- `create_task` gains an optional `category` parameter with the same three values. If the user says *"צרי משימה"* without specifying, the agent asks (*"איזה כובע? עבודה / ועד בית / אישי?"*) — same pattern the existing urgency flow uses.
- New tool `update_task_category(task_name, category)` — fuzzy-matches the task and updates the category. Returns a Hebrew confirmation.
- `list_tasks` gains an optional `category` filter so she can say *"הצגי את המשימות של ועד בית"*.

`backend/app/agent/prompts.py` — add a one-paragraph section under the tasks block describing the three hats and their Hebrew synonyms (so the agent can handle *"כובע"* / *"קטגוריה"* / *"תחום"* naturally).

## Edge cases

| Case | Behavior |
|---|---|
| Existing tasks after migration | All backfilled to `work`. She re-categorizes as needed |
| Task created via API without `category` | Defaults to `work` (schema default) |
| Bot user creates a task and doesn't specify a category | Agent asks — does not silently default. Same UX as urgency today |
| Filter chip set to a category with zero tasks | Existing "אין משימות" empty state renders |
| URL has `?category=` unknown value | Treat as `"all"`; do not crash |
| User toggles sidebar collapsed state | Expandable group hides sub-items; selected sub-item state is retained internally so expanding again restores correctly |

## Testing plan

**Backend unit** — `backend/tests/test_task_category.py`:
- `POST /api/tasks` without `category` → stored as `work`.
- `POST /api/tasks` with each valid value → stored correctly.
- `POST /api/tasks` with invalid category (`"other"`) → 422.
- `GET /api/tasks?category=vaad` → only `vaad` rows.
- `GET /api/tasks?category=all` → all rows (param ignored / same as missing).
- Combination: `GET /api/tasks?category=personal&status=open` → intersection.

**Frontend** — manual smoke list:
- Create a task, pick each of the three categories, see them appear in the correct chip filter.
- Switch the sidebar sub-item, see the counter and the page stay in sync.
- Refresh on `/tasks?category=vaad` — filter + sidebar active state both restore.
- Collapse the sidebar — expandable group collapses cleanly, no layout jump.
- Expand + collapse the group, reload page — remembers the expanded state.

**Bot agent** — `backend/tests/test_agent_category.py`:
- "צרי משימה לסדר את המקרר" → agent asks for category.
- "צרי משימה אישית לסדר את המקרר" → creates with `category=personal`.
- "הצגי משימות ועד בית" → calls `list_tasks(category="vaad")`.
- "העבירי את המשימה X לאישי" → calls `update_task_category`.

## Files touched

**Backend**
- `backend/alembic/versions/<rev>_add_task_category.py` (new)
- `backend/app/models/task.py`
- `backend/app/schemas/task.py`
- `backend/app/services/task_service.py` (filter param)
- `backend/app/api/tasks.py` (query string param)
- `backend/app/agent/tools.py` (3 tools touched)
- `backend/app/agent/prompts.py`
- `backend/tests/test_task_category.py` (new)
- `backend/tests/test_agent_category.py` (new)

**Frontend**
- `frontend/lib/taskCategories.ts` (new)
- `frontend/lib/types.ts`
- `frontend/lib/queries/tasks.ts`
- `frontend/app/tasks/page.tsx`
- `frontend/app/tasks/TaskForm.tsx`
- `frontend/components/ui/TaskCard.tsx`
- `frontend/components/layout/Shell.tsx` (expandable group)
