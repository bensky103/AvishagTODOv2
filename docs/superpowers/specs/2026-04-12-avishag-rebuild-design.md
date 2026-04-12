# Avishag Purchase Manager — Full Rebuild Design Spec

## Overview

Rebuild of the Avishag purchase management system — a Hebrew RTL web app for a purchase manager to track tasks, suppliers, and quality issues. Backed by a Telegram bot with GPT-4o for natural language interaction. The existing backend (in `AvishagBot/`) is the reference implementation; this rebuild produces a fresh, cohesive codebase where backend and frontend are built together.

## Architecture

**Monorepo, single Docker image:**

```
avishag/
├── backend/              # FastAPI (Python 3.12)
│   ├── alembic/          # Database migrations
│   ├── app/
│   │   ├── agent/        # Telegram bot + LangChain agent
│   │   │   ├── agent.py  # LangChain agentic loop (gpt-4o)
│   │   │   ├── bot.py    # python-telegram-bot polling
│   │   │   ├── prompts.py # Hebrew system prompt
│   │   │   ├── tools.py  # 9 LLM-callable tools
│   │   │   └── callbacks.py
│   │   ├── api/          # REST endpoints
│   │   │   ├── tasks.py
│   │   │   ├── suppliers.py
│   │   │   └── issues.py
│   │   ├── models/       # SQLAlchemy async ORM
│   │   │   ├── task.py
│   │   │   ├── supplier.py
│   │   │   ├── issue_report.py
│   │   │   └── action_item.py
│   │   ├── schemas/      # Pydantic request/response
│   │   │   ├── task.py
│   │   │   ├── supplier.py
│   │   │   ├── issue_report.py
│   │   │   └── action_item.py
│   │   ├── services/     # Business logic
│   │   │   ├── task_service.py
│   │   │   ├── supplier_service.py
│   │   │   └── issue_service.py
│   │   ├── config.py     # pydantic-settings
│   │   ├── database.py   # async SQLAlchemy + aiosqlite
│   │   └── main.py       # FastAPI app + static file serving
│   ├── requirements.txt
│   └── start.sh
├── frontend/             # Next.js 14
│   ├── app/              # App Router pages
│   ├── components/       # UI components
│   └── lib/              # API client, hooks, types
├── Dockerfile            # Multi-stage: build frontend, serve via FastAPI
├── docker-compose.yml
├── .env.example
└── .gitignore
```

**Deployment:** Single container on port 8000. FastAPI serves the Next.js static export at `/`, API at `/api/*`. Telegram bot runs as async background task in FastAPI lifespan.

## Database Schema

Async SQLite via aiosqlite. Alembic for migrations.

### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | int, PK | auto-increment |
| title | string | required |
| description | text | nullable |
| due_date | date | nullable |
| urgency | enum: low, medium, high, critical | default: medium |
| is_completed | bool | default: false |
| created_at | datetime | auto |
| completed_at | datetime | nullable |

### suppliers
| Column | Type | Notes |
|--------|------|-------|
| id | int, PK | auto-increment |
| name | string | required |
| contact_info | string | nullable |
| notes | text | nullable |
| created_at | datetime | auto |

### issue_reports
| Column | Type | Notes |
|--------|------|-------|
| id | int, PK | auto-increment |
| supplier_id | int, FK → suppliers | required |
| product_name | string | required |
| sku | string | nullable |
| arrival_date | date | required |
| problem_description | text | required |
| status | enum: open, in_progress, resolved | default: open |
| created_at | datetime | auto |
| resolved_at | datetime | nullable |

### action_items
| Column | Type | Notes |
|--------|------|-------|
| id | int, PK | auto-increment |
| issue_report_id | int, FK → issue_reports | required |
| task_id | int, FK → tasks | nullable (links action item to a task) |
| description | text | required |
| is_completed | bool | default: false |
| created_at | datetime | auto |

**Key relationship:** action_items can optionally link to tasks. Completing/reopening an action item syncs the linked task's completion status.

## REST API

### Tasks — `/api/tasks`
- `POST /` — create task (title, description?, due_date?, urgency?)
- `GET /` — list tasks (filters: status=open|completed, urgency, due_before)
- `GET /{id}` — get task detail
- `PATCH /{id}` — update task fields
- `POST /{id}/complete` — mark completed
- `POST /{id}/reopen` — reopen

### Suppliers — `/api/suppliers`
- `POST /` — create supplier (name, contact_info?, notes?)
- `GET /` — list all suppliers (ordered by name)
- `GET /{id}` — get supplier detail
- `PATCH /{id}` — update supplier

### Issues — `/api/issues`
- `POST /` — create issue report
- `GET /` — list issues (filters: supplier_id, status)
- `GET /{id}` — get issue detail (eager-loads action_items)
- `PATCH /{id}` — update issue
- `POST /{id}/resolve` — mark resolved
- `POST /{id}/reopen` — reopen
- `POST /{id}/action-items` — add action item (with optional create_task flag)
- `POST /action-items/{id}/complete` — complete action item (+ syncs linked task)
- `POST /action-items/{id}/uncomplete` — reopen action item (+ syncs linked task)

### Health
- `GET /health` — returns `{"status": "ok"}`

## Telegram Bot + LLM Agent

**Stack:** python-telegram-bot 21.x, LangChain + ChatOpenAI (gpt-4o)

**Bot (bot.py):**
- Polls for messages from a single authorized Telegram user (TELEGRAM_ALLOWED_USER_ID)
- Maintains in-memory conversation history (max 20 messages per user, trimmed at 40)
- Passes messages to the LangChain agent
- Runs as async background task in FastAPI lifespan

**Agent (agent.py):**
- LangChain bind-tools pattern: LLM decides which tools to call
- Agentic loop: LLM → tool calls → results → repeat until final text response
- Conversation history passed as message list for context

**9 Tools (tools.py):**
1. `create_task(title, description, due_date, urgency)`
2. `list_tasks(status, urgency, due_before)`
3. `complete_task(task_id)`
4. `create_supplier(name, contact_info)`
5. `list_suppliers()`
6. `create_issue_report(supplier_name, product_name, problem_description, arrival_date, sku)`
7. `list_issues(supplier_name, status)`
8. `add_action_item(issue_report_id, description, create_task)`
9. `resolve_issue(issue_report_id)`

**System Prompt (prompts.py):** Hebrew. Instructs the bot to understand Hebrew/English, respond in Hebrew, fuzzy-match supplier names, handle relative dates (מחר = tomorrow, דחוף = today), suggest follow-up tasks when creating issues.

## Frontend Design

### Tech Stack
- Next.js 14 (App Router, static export via `next export`)
- React 18 + TypeScript
- @tanstack/react-query 5.x for server state
- Tailwind CSS 3.x
- Heebo (body) + Secular One (headings) — Google Fonts, Hebrew support

### Visual Design — "Ocean Cards"

**Color palette:**
- Primary: Ocean blue `#0ea5e9` (sky-500) / `#0284c7` (sky-600)
- Background: `#f8fafc` (slate-50)
- Cards: white with subtle shadow
- Text primary: `#0f172a` (slate-900)
- Text secondary: `#94a3b8` (slate-400)

**Urgency border colors (right border on RTL cards):**
- Critical: `#ef4444` (red-500)
- High: `#f59e0b` (amber-500)
- Medium: `#0ea5e9` (sky-500, matches primary)
- Low: `#d1d5db` (gray-300)

**Urgency badge colors:**
- Critical: red bg/text
- High: amber bg/text
- Medium: slate bg/text
- Low: gray bg/text

**Page headers:** Blue gradient (`#0ea5e9` → `#0284c7`), white text. Content area below with rounded top corners overlapping the header.

**Cards:** White, 12px border-radius, subtle box-shadow, colored right border for urgency.

**Bottom tab bar:** White background, 4 tabs (Dashboard, Tasks, Suppliers, Issues). Active tab gets a floating blue pill with slight shadow elevation.

**Filter chips:** On blue header backgrounds: white active, semi-transparent inactive. On white body: blue active, gray inactive. Pill-shaped (20px radius).

**Checkboxes:** Circular (tasks), blue border, filled dark on completion with white checkmark.

**Direction:** RTL throughout. All padding, borders, and alignment are RTL-aware.

### Pages

**Dashboard (`/`)**
- Greeting with user name and date (Hebrew)
- 4 KPI cards in 2x2 grid: open tasks, overdue (red-tinted), open issues, supplier count
- "Needs Attention" section: tasks due within 7 days, sorted by urgency
- "Recent Issues" section: last 5 open issues

**Tasks (`/tasks`)**
- Blue gradient header with title + task count
- Filter chips: All / Open / Completed
- Task list: individual white cards with right urgency border, checkbox, title, due date, urgency badge
- Completed tasks: struck-through, dimmed opacity
- FAB-style "+" button for creating new tasks
- Tap task → detail view (slide-up modal on mobile)

**Suppliers (`/suppliers`)**
- Blue gradient header
- Search bar
- Supplier cards: name, contact info, issue count badge (red if >0, green "OK" if 0)
- Tap supplier → detail view with info + linked issues

**Issues (`/issues`)**
- Blue gradient header
- Filter chips: Open / In Progress / Resolved
- Issue cards: title, supplier name, date, status badge, description preview, action item count
- Tap issue → detail page (`/issues/[id]`) showing full description + action items list

### Mobile Interactions
- Bottom tab bar for navigation (always visible)
- Pull-to-refresh on list pages (via React Query refetch)
- Swipe-to-complete on task items (stretch goal, not required for v1)
- Modal forms for create/edit (slide up from bottom)
- Toast notifications for mutations (success/error)

### Desktop Behavior
- Same layout scales up; content centered with max-width
- On wider screens, tasks/suppliers pages can show split-pane (list + detail side by side)
- Bottom tab bar remains (consistent with mobile-first)

### API Client (`lib/api.ts`)
Namespace objects with methods mapping to REST endpoints. Base URL: `/api` (same origin, served by FastAPI).

### React Query Hooks (`lib/queries/`)
- `useTasks(filters)`, `useTask(id)`, `useCreateTask()`, `useUpdateTask()`, `useToggleTask()`
- `useSuppliers()`, `useSupplier(id)`, `useCreateSupplier()`, `useUpdateSupplier()`
- `useIssues(filters)`, `useIssue(id)`, `useCreateIssue()`, `useResolveIssue()`, `useReopenIssue()`
- `useAddActionItem()`, `useToggleActionItem()`
- staleTime: 30s, refetchOnWindowFocus: true
- Mutations invalidate relevant query keys

## Configuration

**Environment variables (.env):**
```
DATABASE_URL=sqlite+aiosqlite:///./data/avishag.db
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_USER_ID=123456789
```

## Docker

**Multi-stage Dockerfile:**
1. Stage 1 (node:20-alpine): `npm ci` + `npm run build` in frontend/
2. Stage 2 (python:3.12-slim): install requirements, copy backend + frontend static output
3. FastAPI mounts `frontend/out/` as static files at `/`
4. Expose port 8000, run `start.sh` (alembic upgrade head + uvicorn)

**docker-compose.yml:** Single service, volume for `/data` (SQLite persistence), env_file for secrets.

## Testing

**Backend:** pytest + pytest-asyncio
- Model tests, service tests, API endpoint tests, agent tool tests

**Frontend:** No test suite required for v1. TypeScript strict mode provides type safety.
