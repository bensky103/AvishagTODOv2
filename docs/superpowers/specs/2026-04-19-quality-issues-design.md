# "Quality Issues" Rename + Excel-style Fields — Design

**Date:** 2026-04-19
**Status:** Approved for implementation planning
**Scope item:** TODO.md item #3 second half — rename *תקלות* to *בעיות איכות* everywhere in the UI, and add three new free-text fields so Avishag can track the information she today keeps in a separate Excel file.

## Goal

1. Rename every user-facing instance of *תקלות / תקלה* to *בעיות איכות / בעיית איכות* across the frontend, the bot prompts, and the bot help text. The internal code identifiers (`IssueReport`, `/api/issues`, `issues` table, etc.) are **not** renamed — this is a copy change only.
2. Extend `IssueReport` with three new nullable text fields: `order_number`, `what_we_did`, `compensation_required`.
3. Render these fields in the issue form, the issue detail view, and a new spreadsheet-style table view that complements (not replaces) the current card list.

## Non-goals

- Rename the code-level entity (`IssueReport` stays).
- Rename the DB table (`issue_reports` stays).
- Rename the API path (`/api/issues` stays).
- Structured compensation amount / currency — `compensation_required` is a single free-text string now. Can be upgraded later if she asks.
- Migrate `action_items` into `what_we_did` — the two co-exist. `what_we_did` is a short summary string; `action_items` remain as the granular task list. (Decision locked: "new free-text column, can change later if she wants.")

## Data model

### Migration

`backend/alembic/versions/<rev>_add_issue_quality_fields.py`:

```python
def upgrade() -> None:
    op.add_column("issue_reports", sa.Column("order_number", sa.String(100), nullable=True))
    op.add_column("issue_reports", sa.Column("what_we_did", sa.Text(), nullable=True))
    op.add_column("issue_reports", sa.Column("compensation_required", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("issue_reports", "compensation_required")
    op.drop_column("issue_reports", "what_we_did")
    op.drop_column("issue_reports", "order_number")
```

### Model

`backend/app/models/issue_report.py`:

```python
order_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
what_we_did: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
compensation_required: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
```

### Schemas

`backend/app/schemas/issue.py` — all three fields added to `IssueCreate`, `IssueUpdate` (all optional), and `IssueRead`.

## Rename map — Hebrew copy

Every frontend / prompt / help-text reference changes as follows. The **code** stays as-is (`IssueReport`, `/api/issues`, etc.).

| Surface | Was | Becomes |
|---|---|---|
| Sidebar nav item (desktop) | תקלות | בעיות איכות |
| BottomNav label (mobile) | תקלות | בעיות איכות |
| Page title on `/issues` | תקלות | בעיות איכות |
| Dashboard KPI label | תקלות פתוחות | בעיות איכות פתוחות |
| Dashboard recent panel | תקלות אחרונות | בעיות איכות אחרונות |
| Dashboard panel empty state | אין תקלות פתוחות | אין בעיות איכות פתוחות |
| Dashboard quick action title | תקלה חדשה | בעיה חדשה |
| Dashboard quick action subtitle | דווח על תקלה | דווח על בעיה |
| `/issues` empty state | אין תקלות | אין בעיות איכות |
| FAB on `/issues` | הוסף תקלה | הוסף בעיה |
| `IssueForm` modal title | תקלה חדשה / עריכת תקלה | בעיה חדשה / עריכת בעיה |
| Issue status labels | פתוחה / בטיפול / נפתרה | unchanged — these are state labels, not the entity name |
| Toast: "התקלה נוצרה בהצלחה" | התקלה נוצרה | הבעיה נוצרה |
| All other toast strings with "תקלה" | … | same replacement pattern |
| Bot `HELP_TEXT` in `backend/app/agent/bot.py` | ⚠️ *תקלות* / "פתיחת תקלה…" | ⚠️ *בעיות איכות* / "פתיחת בעיה…" |
| Bot agent system prompt in `backend/app/agent/prompts.py` | all references | replaced; also add a note that the user may call them *תקלה* colloquially and the agent should accept that input interchangeably |
| `for_boaz.md` | ## תקלות | ## בעיות איכות (this is the customer-facing demo guide) |

**Agent back-compatibility**: the bot must still understand the word *תקלה* when Avishag uses it — she's been using it for months and won't switch overnight. Add an explicit line to `prompts.py`: *"המשתמשת עשויה לקרוא לבעיות איכות גם 'תקלות' — זה אותו דבר."*

## Frontend — new fields in UI

### `frontend/app/issues/IssueForm.tsx`

Add three optional inputs below the existing "תיאור הבעיה" field (grouped together so they feel like the "Excel row" she asked for):

```
┌─────────────────────────────┐
│ תיאור הבעיה (existing)      │
│ [ textarea ]                │
├─────────────────────────────┤
│ מספר הזמנה                  │
│ [ text, optional ]          │
├─────────────────────────────┤
│ מה עשינו                    │
│ [ textarea, optional, 2rows]│
├─────────────────────────────┤
│ פיצוי נדרש                  │
│ [ text, optional ]          │
│ (למשל: החלפה, זיכוי 200 ₪)  │
└─────────────────────────────┘
```

All three map 1:1 to the new schema fields. Send `undefined` (not empty string) on submit when blank so the backend stores `NULL`.

### `frontend/app/issues/IssueDetail.tsx`

Render each field with its label only when present. Suppress the row entirely when the value is `null` (don't clutter the detail with empty labels).

### New spreadsheet view on `/issues`

A toggle button in the page header switches between two modes:

```
┌───────────────────────────────────┐
│ בעיות איכות    [ כרטיסים | טבלה ] │
│                                   │
│ [ filter chips (unchanged) ]      │
└───────────────────────────────────┘
```

- Mode state lives in URL param `?view=cards|table`. Default `cards` (current behavior preserved).
- Card view = exactly what the page renders today.
- Table view = a dense `<table>` with these columns, left-to-right in the Hebrew RTL visual order:

  | תאריך | ספק | מס' הזמנה | תיאור הבעיה | מה עשינו | פיצוי נדרש | סטטוס |
  |---|---|---|---|---|---|---|

  - Row click opens the existing `IssueDetail` modal.
  - Cells that are long (description, what_we_did) truncate with `line-clamp-2`; full text shown in the detail modal.
  - Empty cells render `—` in muted color.
  - Sortable: clicking a column header sorts by that column. Default sort: `arrival_date` desc (newest first).
  - Table is horizontally scrollable on mobile (overflow-x-auto) — we do not try to fit 7 columns on a phone screen. Card view remains the primary mobile experience.

### `frontend/components/ui/ViewToggle.tsx` (new)

Small two-state toggle styled to match existing filter chips. Reused only on `/issues` for now; kept generic enough to reuse elsewhere later if needed.

## Bot agent integration

`backend/app/agent/tools.py`:

- `create_issue` accepts three new optional kwargs: `order_number`, `what_we_did`, `compensation_required`.
- `update_issue` (or the equivalent existing tool) accepts the same three kwargs.
- The agent does **not** ask for these fields proactively on creation — they're additive, usually filled in later. Only offers them if the user mentions them (*"פתחי תקלה על X, המספר הזמנה הוא 2043"*).

## Edge cases

| Case | Behavior |
|---|---|
| Existing issues after migration | All three new columns are `NULL`. Form and detail hide them gracefully |
| Avishag still says "תקלה" to the bot | Agent treats as synonym; no correction. Response uses "בעיה" to model the new vocabulary without nagging |
| Table view on mobile | Horizontal scroll; row tap still opens detail |
| `?view=table` URL param invalid value | Fall back to `cards` |
| Very long `what_we_did` (thousands of chars) | `Text` column accepts it; table cell truncates to 2 lines; detail modal shows full |
| Sort on a column where many rows are `NULL` | Nulls sink to the bottom regardless of sort direction |

## Testing plan

**Backend** — `backend/tests/test_issue_quality_fields.py`:
- `POST /api/issues` with all three new fields → persisted and returned.
- `POST /api/issues` without them → all three are `null` on `GET`.
- `PATCH` one field at a time → others unchanged.
- `PATCH` setting a field to empty string → stored as `NULL` (or trimmed then null-ified; decision: treat `""` as `null` in the service layer, identical to how `description` already works).

**Frontend** — manual smoke:
- Create an issue with all three new fields, see them in the detail.
- Switch to table view, verify the 7 columns render with new values.
- Click a column header, verify sort reverses.
- Refresh on `?view=table`, view persists.
- Every renamed string renders correctly in Hebrew (spot-check sidebar, dashboard, page, modal, toasts).

**Bot** — `backend/tests/test_agent_issue_rename.py`:
- "פתחי תקלה על X" → still creates an issue (rename tolerance).
- "פתחי בעיית איכות על X" → creates an issue.
- "פתחי בעיה על X, מספר הזמנה 2043" → creates issue with `order_number="2043"`.

## Files touched

**Backend**
- `backend/alembic/versions/<rev>_add_issue_quality_fields.py` (new)
- `backend/app/models/issue_report.py`
- `backend/app/schemas/issue.py`
- `backend/app/services/issue_service.py`
- `backend/app/agent/tools.py`
- `backend/app/agent/prompts.py`
- `backend/app/agent/bot.py` (help text rename)
- `backend/tests/test_issue_quality_fields.py` (new)
- `backend/tests/test_agent_issue_rename.py` (new)

**Frontend**
- `frontend/lib/types.ts` (add 3 fields to `Issue`)
- `frontend/lib/queries/issues.ts` (input types)
- `frontend/app/page.tsx` (dashboard copy rename)
- `frontend/app/issues/page.tsx` (title rename, view toggle, table mode)
- `frontend/app/issues/IssueForm.tsx` (3 new inputs + title rename)
- `frontend/app/issues/IssueDetail.tsx` (3 new rows)
- `frontend/components/layout/Shell.tsx` (sidebar label rename)
- `frontend/components/layout/BottomNav.tsx` (mobile nav label rename)
- `frontend/components/ui/ViewToggle.tsx` (new)

**Docs**
- `for_boaz.md` (rename the ## תקלות section heading and surrounding prose)
