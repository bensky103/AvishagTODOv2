"""Regression tests for task toggle (complete/reopen).

Bug: Clicking a task checkbox would visually check it, then snap back to
unchecked even though the server returned 200 OK. Root cause was a frontend
React Query race condition, but these tests lock down the backend contracts
the frontend relies on so that any future backend change doesn't make the
problem resurface.
"""

import asyncio

import pytest


# ── helpers ──────────────────────────────────────────────────────────────

async def _create_task(client, title="Regression task", **extra):
    res = await client.post("/api/tasks/", json={"title": title, **extra})
    assert res.status_code == 201
    return res.json()


# ── complete / reopen response correctness ───────────────────────────────

@pytest.mark.asyncio
async def test_complete_returns_is_completed_true(client):
    """POST /complete must return the task with is_completed=True."""
    task = await _create_task(client)
    res = await client.post(f"/api/tasks/{task['id']}/complete")
    assert res.status_code == 200
    body = res.json()
    assert body["is_completed"] is True
    assert body["completed_at"] is not None


@pytest.mark.asyncio
async def test_reopen_returns_is_completed_false(client):
    """POST /reopen must return the task with is_completed=False."""
    task = await _create_task(client)
    await client.post(f"/api/tasks/{task['id']}/complete")

    res = await client.post(f"/api/tasks/{task['id']}/reopen")
    assert res.status_code == 200
    body = res.json()
    assert body["is_completed"] is False
    assert body["completed_at"] is None


# ── list endpoint reflects toggle immediately ────────────────────────────

@pytest.mark.asyncio
async def test_list_reflects_completion_immediately(client):
    """After completing a task, GET /tasks?status=open must exclude it."""
    task = await _create_task(client)
    await client.post(f"/api/tasks/{task['id']}/complete")

    open_tasks = (await client.get("/api/tasks/", params={"status": "open"})).json()
    completed_tasks = (await client.get("/api/tasks/", params={"status": "completed"})).json()

    open_ids = [t["id"] for t in open_tasks]
    completed_ids = [t["id"] for t in completed_tasks]

    assert task["id"] not in open_ids
    assert task["id"] in completed_ids


@pytest.mark.asyncio
async def test_list_reflects_reopen_immediately(client):
    """After reopening a task, GET /tasks?status=open must include it again."""
    task = await _create_task(client)
    await client.post(f"/api/tasks/{task['id']}/complete")
    await client.post(f"/api/tasks/{task['id']}/reopen")

    open_tasks = (await client.get("/api/tasks/", params={"status": "open"})).json()
    completed_tasks = (await client.get("/api/tasks/", params={"status": "completed"})).json()

    open_ids = [t["id"] for t in open_tasks]
    completed_ids = [t["id"] for t in completed_tasks]

    assert task["id"] in open_ids
    assert task["id"] not in completed_ids


# ── rapid toggling (simulates fast clicks) ───────────────────────────────

@pytest.mark.asyncio
async def test_rapid_complete_reopen_settles_correctly(client):
    """Rapid complete→reopen→complete must leave the task completed."""
    task = await _create_task(client)
    tid = task["id"]

    await client.post(f"/api/tasks/{tid}/complete")
    await client.post(f"/api/tasks/{tid}/reopen")
    await client.post(f"/api/tasks/{tid}/complete")

    res = await client.get(f"/api/tasks/{tid}")
    assert res.json()["is_completed"] is True
    assert res.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_rapid_toggle_list_consistency(client):
    """After rapid toggling, the list endpoint must agree with the single-task endpoint."""
    task = await _create_task(client)
    tid = task["id"]

    # Toggle several times
    for _ in range(3):
        await client.post(f"/api/tasks/{tid}/complete")
        await client.post(f"/api/tasks/{tid}/reopen")

    # Final state: reopened (is_completed=False)
    single = (await client.get(f"/api/tasks/{tid}")).json()
    all_tasks = (await client.get("/api/tasks/")).json()
    from_list = next(t for t in all_tasks if t["id"] == tid)

    assert single["is_completed"] is False
    assert from_list["is_completed"] is False
    assert single["is_completed"] == from_list["is_completed"]


# ── concurrent toggles on different tasks ────────────────────────────────

@pytest.mark.asyncio
async def test_concurrent_toggles_on_different_tasks(client):
    """Completing multiple tasks concurrently must not corrupt each other."""
    tasks = [await _create_task(client, title=f"Task {i}") for i in range(5)]

    # Complete all concurrently
    results = await asyncio.gather(
        *[client.post(f"/api/tasks/{t['id']}/complete") for t in tasks]
    )
    for r in results:
        assert r.status_code == 200
        assert r.json()["is_completed"] is True

    # Verify via list
    all_tasks = (await client.get("/api/tasks/", params={"status": "completed"})).json()
    completed_ids = {t["id"] for t in all_tasks}
    for t in tasks:
        assert t["id"] in completed_ids


# ── idempotency ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_complete_already_completed_task(client):
    """Completing an already-completed task should still return 200."""
    task = await _create_task(client)
    await client.post(f"/api/tasks/{task['id']}/complete")

    res = await client.post(f"/api/tasks/{task['id']}/complete")
    assert res.status_code == 200
    assert res.json()["is_completed"] is True


@pytest.mark.asyncio
async def test_reopen_already_open_task(client):
    """Reopening an already-open task should still return 200."""
    task = await _create_task(client)

    res = await client.post(f"/api/tasks/{task['id']}/reopen")
    assert res.status_code == 200
    assert res.json()["is_completed"] is False


# ── 404 on missing task ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_complete_nonexistent_task_returns_404(client):
    res = await client.post("/api/tasks/99999/complete")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_reopen_nonexistent_task_returns_404(client):
    res = await client.post("/api/tasks/99999/reopen")
    assert res.status_code == 404


# ── completed_at timestamp correctness ───────────────────────────────────

@pytest.mark.asyncio
async def test_completed_at_set_on_complete_cleared_on_reopen(client):
    """completed_at must be set when completing and cleared when reopening."""
    task = await _create_task(client)
    tid = task["id"]
    assert task["completed_at"] is None

    completed = (await client.post(f"/api/tasks/{tid}/complete")).json()
    assert completed["completed_at"] is not None

    reopened = (await client.post(f"/api/tasks/{tid}/reopen")).json()
    assert reopened["completed_at"] is None
