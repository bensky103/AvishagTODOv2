# Default `/tasks` Filter to "Open" — Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope item:** TODO.md item #4 — *"In missions page it should show default to the open missions tab at the front sub-page, instead of all"*

## Goal

When Avishag navigates to `/tasks`, she should see **open tasks** by default, not the "all" view that includes completed ones. Completed tasks should still be reachable — just one click away via the filter chip.

## Implementation

`frontend/app/tasks/page.tsx` currently uses local `useState<FilterOption>("all")`. Migrate to URL-param state mirroring `/issues`:

```ts
type FilterOption = "all" | "open" | "completed";
const VALID_FILTERS: FilterOption[] = ["all", "open", "completed"];

function TasksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramFilter = searchParams.get("status") as FilterOption | null;
  const filter: FilterOption = paramFilter && VALID_FILTERS.includes(paramFilter)
    ? paramFilter
    : "open";   // <-- was "all" — this is the behavior change

  const setFilter = useCallback((val: FilterOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", val);
    router.replace(`?${params.toString()}`);
  }, [searchParams, router]);

  // ...rest unchanged
}
```

Wrap the existing page body in `<Suspense>` to satisfy the Next.js requirement for `useSearchParams`, again matching how `/issues/page.tsx` does it.

## Why URL-param

Three reasons, in order of importance:
1. **Consistency** — `/issues` already behaves this way. Two pages, one pattern.
2. **Bookmarkable** — sending a link to `/tasks?status=open` deep-links to a specific view.
3. **Preserves intent on refresh** — if she clicks "הכל" and then hits reload, she stays on "הכל" instead of snapping back to "open."

## Interaction with item C (categories)

This change is compatible with item C's `?category=` param. Both coexist; the tasks page reads both params independently. No ordering issue — item C's spec calls out the same pattern.

## Non-goals

- Changing the label or appearance of the chips.
- Changing the bottom-nav `משימות` entry (it points at `/tasks`; the default there is now "open," which is what she wants).
- Adding a "remember my last filter" preference beyond what the URL already provides.

## Edge cases

| Case | Behavior |
|---|---|
| User lands on `/tasks` with no `?status=` | Shows `"open"` |
| `/tasks?status=` with unknown value | Falls back to `"open"` |
| User clicks "הכל" chip | URL becomes `/tasks?status=all`; persists on reload |
| User clicks a task, completes it, returns to `/tasks` | Still sees open tasks — the just-completed one is gone from view (which is correct; she can click "הושלמו" to confirm) |
| Browser back button after chip click | URL-param navigation uses `router.replace`, so back goes to whatever page she came *from* (e.g., the dashboard), not through chip changes. Mirrors `/issues` |

## Testing plan

Pure frontend change — covered by manual smoke only:
- Fresh load of `/tasks` → "פתוחות" chip is active, list shows only open tasks.
- Click "הכל" → URL gains `?status=all`, list updates.
- Reload → "הכל" remains active.
- Click "הושלמו" → shows completed tasks.
- Return to `/tasks` (no param) → "פתוחות" default restored.

## Files touched

- `frontend/app/tasks/page.tsx` — ~15 lines of diff
