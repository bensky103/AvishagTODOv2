# Dashboard Cleanup — Remove Suppliers Surface — Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope item:** New request from 2026-04-19 review — dashboard image markup crosses out the "ספקים" KPI card and the "ספק חדש" quick-action button.

## Goal

Avishag rarely creates suppliers from the dashboard — they're typically created inline when opening an issue for a new supplier. The suppliers surface on the dashboard is dead weight that dilutes the action list. Remove it from the dashboard; leave the dedicated `/suppliers` page and sidebar entry untouched for the times she does need full supplier CRUD.

## Scope

On `frontend/app/page.tsx` only:

1. **Remove the "ספקים" KPI card** (4th card in the top KPI grid).
2. **Remove the "ספק חדש" quick-action button** (3rd card in the quick-actions grid).
3. **Remove the `SupplierForm` modal + `showSupplierForm` state + `useSuppliers` hook call** that were wired into the removed button. Drop the now-unused `SupplierForm` import.

That's it. No backend changes. No navigation changes.

## What stays untouched

- `/suppliers` page — unchanged.
- Sidebar "ספקים" entry with its count badge — unchanged.
- Mobile `BottomNav` "ספקים" entry — unchanged.
- The "תקלות אחרונות" dashboard panel, which shows per-issue supplier context — unchanged (suppliers aren't the focus there, issues are).
- `useSuppliers` is still used elsewhere (for example, the issues list resolves supplier names via `useSuppliers`).

## Grid re-layout

The top KPI row goes from 4 → 3 cards. Adjust:

```tsx
// Before:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

// After:
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
```

Rationale: 3 cards at 1 per row on phones reads clean; 3 across on tablet/desktop still fills the container evenly. The previous `grid-cols-2` on mobile created an awkward 2+1+1 wrap once we drop to 3 cards.

The quick-actions row stays at `grid-cols-3` but with 2 buttons, the third cell is empty. Change to `grid-cols-2` so the two remaining buttons fill the width evenly:

```tsx
// Before:
<div className="grid grid-cols-3 gap-3 md:gap-4 pb-8">

// After:
<div className="grid grid-cols-2 gap-3 md:gap-4 pb-8">
```

## Interaction with item D (quality issues rename)

The dashboard's "תקלות פתוחות" KPI and "תקלה חדשה" quick action are **also** marked for rename in item D's spec. That's handled there. This spec is **only** about removal; the rename lives in the quality-issues spec.

## Edge cases

| Case | Behavior |
|---|---|
| Sidebar still has "ספקים" entry | Works as before — nav state is independent from dashboard content |
| `/suppliers` is reachable via URL | Yes — this spec only removes dashboard surfaces |
| Issue form's "pick a supplier" dropdown | Unaffected; it lives inside `IssueForm`, not the dashboard |

## Testing plan

Manual only, pure copy / layout change:
- Dashboard renders 3 KPI cards in the top row, no "ספקים" anywhere.
- Quick-actions row has exactly 2 buttons, filling the row evenly.
- Sidebar still shows "ספקים" → click navigates to `/suppliers` which still works.
- Navigating `/suppliers` and creating a supplier still succeeds (no regression — the page's own `SupplierForm` is the one that matters, not the dashboard's).
- No console warnings about unused variables / imports.

## Files touched

- `frontend/app/page.tsx` — remove imports, state, KPI card, quick-action button, and adjust two grid class strings.
