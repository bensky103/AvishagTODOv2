# Task Reminders via Telegram — Design

**Date:** 2026-04-19
**Author:** Guy (with Claude)
**Status:** Approved for implementation planning
**Scope item:** TODO.md item #1 (reminders). Item #2 (settings page) is explicitly dropped — single-user app, no settings UI needed.

## Goal

Let Avishag mark any task as "remind me" with a single boolean toggle. Once per day at **09:00 Asia/Jerusalem**, the existing Telegram bot sends her one digest message listing every opted-in task that is due today or overdue-and-still-open.

## Non-goals (deferred)

- Snooze / "remind me again later."
- Per-task custom reminder time — everything fires at 09:00.
- Multiple Telegram recipients / chat IDs.
- Retro-firing missed reminders after a server restart.
- Reminder history / audit log.
- A settings page (TODO item #2 — dropped).

## Architecture

The scheduler lives inside the FastAPI process, alongside the existing Telegram `Application` started in `backend/app/main.py`'s `lifespan` context. No new container, no new environment variables.

```
FastAPI process (lifespan)
├── Telegram Application (long-poll, pre-existing)
└── APScheduler AsyncIOScheduler (new)
    └── CronTrigger(hour=9, minute=0, timezone="Asia/Jerusalem")
        └── send_daily_reminder()
            1. Query tasks where reminder_enabled=TRUE
               AND due_date <= today_il
               AND is_completed=FALSE
            2. Partition into "today" and "overdue"
            3. Format Hebrew message (or None if both empty)
            4. bot_app.bot.send_message(allowed_user_id, text)
```

The scheduler gets a reference to the same `Application` instance that `start_bot()` creates; no second Telegram connection, no message queue.

### Why APScheduler, not a hand-rolled loop

Israel observes DST. A plain `asyncio.sleep(seconds_until_next_9am)` loop drifts twice a year unless it recomputes against `ZoneInfo("Asia/Jerusalem")` every tick. APScheduler's `CronTrigger` takes a timezone argument and handles DST correctly for free.

### Why in-process, not a separate worker

The Telegram long-poll `Application` is already running in the FastAPI process. Splitting the scheduler into its own container would mean a second bot connection or a queue. Same-process keeps the deploy shape unchanged — one container, one `.env`.

### Known trade-off: no retro-fire on restart

APScheduler uses an in-memory job store. If the process is down at 09:00 Israel time, that day's reminder is lost. Acceptable because:
1. The user can always check the task list on the web.
2. Any task still open-and-overdue the next morning will reappear in the next digest automatically.
3. A persistent job store + missed-run detection is a ~10× complexity jump for a single-user app.

## Data model

### Migration

New Alembic revision `backend/alembic/versions/<rev>_add_task_reminder.py`:

```python
def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_tasks_reminder_enabled", "tasks", ["reminder_enabled"])


def downgrade() -> None:
    op.drop_index("ix_tasks_reminder_enabled", table_name="tasks")
    op.drop_column("tasks", "reminder_enabled")
```

### Model

`backend/app/models/task.py` — one new column:

```python
reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
```

The index keeps the daily query cheap as the task list grows — the SELECT filters on `reminder_enabled=TRUE` first.

### Schemas

`backend/app/schemas/task.py`:
- `TaskCreate`: add `reminder_enabled: bool = False`
- `TaskUpdate`: add `reminder_enabled: bool | None = None`
- `TaskRead`: add `reminder_enabled: bool`

### Server-side validation

Request is rejected with `422` and Hebrew detail `"לא ניתן להפעיל תזכורת ללא תאריך יעד"` when either:
- `reminder_enabled=True` is submitted with `due_date=None`
- A `PATCH` clears `due_date` on a row where `reminder_enabled=True`

Validation lives in the task service (`backend/app/services/task_service.py`), not only in Pydantic, because the "clear due_date on an already-reminder-enabled task" check requires the existing row.

## Reminder service

New file `backend/app/services/reminder_service.py`, responsibilities:

1. `async def list_due_reminders(session) -> tuple[list[Task], list[Task]]` — returns `(today, overdue)`, partitioned and sorted.
   - `today_il = datetime.now(ZoneInfo("Asia/Jerusalem")).date()`
   - Query filter: `reminder_enabled=True AND due_date <= today_il AND is_completed=False`
   - `today` bucket: `due_date == today_il`, sorted by urgency desc (`critical > high > medium > low`), then title.
   - `overdue` bucket: `due_date < today_il`, sorted by `due_date` asc (oldest first — most overdue on top).

2. `def format_reminder_message(today: list[Task], overdue: list[Task], today_il: date) -> str | None`:
   - Returns `None` if both lists are empty (locked: no empty-state message).
   - Otherwise produces:
     ```
     🔔 תזכורת יומית

     📅 להיום (N):
     <icon> <title>
     ...

     ⚠️ באיחור (M):
     • <title> — X ימים
     ...
     ```
   - Urgency icon map: `critical→🔥`, `high→⚡`, `medium→🟡`, `low→·`.
   - "Overdue" day count: `(today_il - task.due_date).days` (always ≥ 1).
   - Sections are omitted if their list is empty — e.g., a morning with only overdue tasks shows just the overdue section.

3. `async def send_daily_reminder(bot_app, session_factory) -> None`:
   - Called by the scheduler.
   - Guards: if `settings.telegram_allowed_user_id == -1` or `bot_app is None`, log a warning and return.
   - Opens a session, calls `list_due_reminders`, calls `format_reminder_message`.
   - If message is `None`, returns without sending.
   - Otherwise `await bot_app.bot.send_message(chat_id=settings.telegram_allowed_user_id, text=message)`.
   - All errors wrapped in a top-level `try/except Exception` with `structlog.error("reminder_job_failed", error=str(exc))`. The scheduler must continue to fire tomorrow regardless of today's outcome.

### Scheduler wiring

New file `backend/app/services/scheduler.py` exposing `start_scheduler(bot_app)` and `stop_scheduler()`. Uses `AsyncIOScheduler` with one job:

```python
scheduler.add_job(
    send_daily_reminder_wrapped,
    CronTrigger(hour=9, minute=0, timezone="Asia/Jerusalem"),
    id="daily_task_reminder",
    replace_existing=True,
)
```

Called from `backend/app/main.py`'s `lifespan`, right after `start_bot()`, and only when `settings.telegram_bot_token` is set (same guard as the bot).

### Dependency

Add to `backend/requirements.txt`:

```
apscheduler==3.10.4
```

(3.x is fine for AsyncIOScheduler. No need for 4.x, which is still alpha at time of writing.)

## Front-end

### Task form

`frontend/app/tasks/TaskForm.tsx` gains a new field immediately after the due-date picker:

```
┌──────────────────────────────────┐
│ תאריך יעד                        │
│ [ 25/04/2026                   ] │
├──────────────────────────────────┤
│ 🔔 תזכורת יומית     [ toggle ]   │
│ שלח תזכורת בטלגרם ב-9:00         │
│ ביום היעד                        │
└──────────────────────────────────┘
```

Behavior:
- Toggle is **disabled** when `dueDate === ""`. Helper text under the row reads *"בחר תאריך יעד כדי להפעיל תזכורת"* in a muted color.
- `useEffect`: if `dueDate` transitions to `""` while `reminderEnabled` is `true`, flip `reminderEnabled` to `false` automatically.
- The existing `handleSubmit` passes `reminder_enabled: reminderEnabled` alongside the other fields in the `data` object for both create and update mutations.
- Uses the same emerald accent and `bg-surface-raised` styling as the rest of the form. If `components/ui/Switch.tsx` does not exist, add one following the surrounding conventions (Tailwind classes, emerald-500 active state, subtle disabled state).

### Task card

`frontend/components/ui/TaskCard.tsx` — when `task.reminder_enabled` is true, render a small 🔔 badge next to the due-date chip so Avishag can see at a glance which tasks will ping her.

### Types

`frontend/lib/types.ts` — `Task` interface gains `reminder_enabled: boolean`.

### Queries

`frontend/lib/queries/tasks.ts` — `CreateTaskInput` / `UpdateTaskInput` types include `reminder_enabled?: boolean`.

## Bot agent tool

`backend/app/agent/tools.py` gains one new tool. Name and shape follow the existing tools' conventions (fuzzy name matching, Hebrew confirmation strings):

```python
@tool
async def toggle_task_reminder(task_name: str, enabled: bool) -> str:
    """Turn the daily 09:00 reminder on or off for a task.

    task_name: fuzzy match against existing task titles.
    enabled: True to turn on, False to turn off.
    Returns a Hebrew confirmation string.
    """
```

Behavior:
- Resolves `task_name` via the same fuzzy matcher other task tools already use.
- If `enabled=True` and the task has no `due_date`, returns *"לא ניתן להפעיל תזכורת ללא תאריך יעד"* without mutating the row.
- Otherwise calls the task service (same path the API uses) to persist the change, returns *"תזכורת הופעלה למשימה X"* / *"תזכורת בוטלה למשימה X"*.

`backend/app/agent/prompts.py` — add one line under the tasks section so the agent knows the capability exists, using phrases like *"הפעילי תזכורת"* / *"בטלי תזכורת"*.

## Edge case behavior table

| Case | Behavior |
|---|---|
| `reminder_enabled=True` + no `due_date` submitted | API returns `422`; UI toggle is disabled so the state is unreachable from the web |
| User clears `due_date` on a task that had reminder ON | Front-end: toggle auto-flips to OFF. Backend: a `PATCH` that clears `due_date` while leaving `reminder_enabled=True` is rejected with `422` |
| Task completed before 09:00 on its due date | Filtered out (`is_completed=FALSE`); not in the digest |
| Task completed mid-digest-build (race) | Worst case the digest mentions a just-completed task. Self-corrects the next morning. Not worth a lock |
| Overdue task completed later | Stops appearing immediately on the next 09:00 run |
| Server restart crosses 09:00 Israel time | That morning's reminder is lost. No retro-fire. Documented trade-off |
| Telegram send fails (network, rate-limit, bad token) | Logged at `error`; no retry. Next day's run acts as a natural retry for anything still open-and-overdue |
| `telegram_allowed_user_id == -1` / bot never started | Scheduler short-circuits with a warning log and skips the send |
| Both lists empty | Skip the send entirely — no "good morning" message |
| `due_date` in the future, `reminder_enabled=True` | Ignored until the due date arrives |

## Testing plan

### Unit — `backend/tests/test_reminder_service.py`
- `format_reminder_message` with 2 today + 1 overdue → exact-string match against the locked Hebrew format.
- `format_reminder_message` with empty lists → returns `None`.
- Urgency sort: `critical` appears above `low` in the "today" section.
- Overdue sort: oldest first.
- "Days overdue" math: task due yesterday reads as `1`, not `0`.
- Section omission: only-overdue input produces a message with no "להיום" section, and vice versa.

### Unit — `backend/tests/test_reminder_query.py`
- Query returns only tasks with `reminder_enabled=True`, `is_completed=False`, `due_date <= today_il`.
- `due_date` tomorrow → excluded.
- Task completed today → excluded.
- Reminder off → excluded even if overdue.

### Integration — `backend/tests/test_task_api_reminder.py`
- `POST /api/tasks` with `reminder_enabled=True, due_date=None` → 422 with Hebrew detail.
- `PATCH` clearing `due_date` while reminder is on → 422.
- `POST` with `reminder_enabled=True` + valid `due_date` → 200; `GET` echoes `reminder_enabled=True`.

### Integration — `backend/tests/test_agent_reminder_tool.py`
- `toggle_task_reminder("הזמנת חומרים", True)` on a task with a due date → persists `True`.
- Same call on a task without `due_date` → returns a Hebrew error, row unchanged.
- `toggle_task_reminder("הזמנת חומרים", False)` → persists `False`.

### Manual smoke test
1. Create a task with due date = today, toggle reminder ON via the web.
2. Trigger `send_daily_reminder` directly (Python REPL or a dev-only admin endpoint) and confirm the Telegram message matches the locked format.
3. Turn the reminder off via the bot (*"בטלי תזכורת ל…"*), refresh the website, confirm the 🔔 badge on the task card disappears.
4. Create a second task with due date = yesterday, reminder ON, and re-trigger — confirm it lands in the "באיחור" section with `— 1 ימים`.

## Files touched — summary

**Backend**
- `backend/alembic/versions/<rev>_add_task_reminder.py` (new)
- `backend/app/models/task.py` (add column)
- `backend/app/schemas/task.py` (add field to 3 schemas)
- `backend/app/services/task_service.py` (validation)
- `backend/app/services/reminder_service.py` (new)
- `backend/app/services/scheduler.py` (new)
- `backend/app/agent/tools.py` (new tool)
- `backend/app/agent/prompts.py` (one-line addition)
- `backend/app/main.py` (start/stop scheduler in lifespan)
- `backend/requirements.txt` (add apscheduler)
- `backend/tests/test_reminder_service.py` (new)
- `backend/tests/test_reminder_query.py` (new)
- `backend/tests/test_task_api_reminder.py` (new)
- `backend/tests/test_agent_reminder_tool.py` (new)

**Frontend**
- `frontend/app/tasks/TaskForm.tsx` (reminder toggle)
- `frontend/components/ui/TaskCard.tsx` (🔔 badge)
- `frontend/components/ui/Switch.tsx` (new, if not already present)
- `frontend/lib/types.ts` (type field)
- `frontend/lib/queries/tasks.ts` (input types)
