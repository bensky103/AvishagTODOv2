import pytest


@pytest.mark.asyncio
async def test_create_task(client):
    """Should create a task and return it."""
    res = await client.post("/api/tasks", json={
        "title": "Test task",
        "urgency": "high",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Test task"
    assert data["urgency"] == "high"
    assert data["is_completed"] is False


@pytest.mark.asyncio
async def test_list_tasks(client):
    """Should list created tasks."""
    await client.post("/api/tasks", json={"title": "Task 1"})
    await client.post("/api/tasks", json={"title": "Task 2"})
    res = await client.get("/api/tasks")
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_get_task(client):
    """Should get a task by ID."""
    create = await client.post("/api/tasks", json={"title": "My task"})
    task_id = create.json()["id"]
    res = await client.get(f"/api/tasks/{task_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "My task"


@pytest.mark.asyncio
async def test_get_task_not_found(client):
    """Should return 404 for non-existent task."""
    res = await client.get("/api/tasks/999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_complete_and_reopen_task(client):
    """Should complete and reopen a task."""
    create = await client.post("/api/tasks", json={"title": "Toggle task"})
    task_id = create.json()["id"]

    # Complete
    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    assert res.json()["is_completed"] is True

    # Reopen
    res = await client.post(f"/api/tasks/{task_id}/reopen")
    assert res.status_code == 200
    assert res.json()["is_completed"] is False


@pytest.mark.asyncio
async def test_update_task(client):
    """Should update task fields."""
    create = await client.post("/api/tasks", json={"title": "Old title", "urgency": "low"})
    task_id = create.json()["id"]

    res = await client.patch(f"/api/tasks/{task_id}", json={"title": "New title"})
    assert res.status_code == 200
    assert res.json()["title"] == "New title"
    assert res.json()["urgency"] == "low"  # unchanged


@pytest.mark.asyncio
async def test_update_task_clear_nullable_field(client):
    """Should be able to clear a nullable field by sending null."""
    create = await client.post("/api/tasks", json={
        "title": "Task with date",
        "due_date": "2026-12-31",
    })
    task_id = create.json()["id"]
    assert create.json()["due_date"] == "2026-12-31"

    # Clear the due_date
    res = await client.patch(f"/api/tasks/{task_id}", json={"due_date": None})
    assert res.status_code == 200
    assert res.json()["due_date"] is None


@pytest.mark.asyncio
async def test_delete_task(client):
    """Should delete a task."""
    create = await client.post("/api/tasks", json={"title": "To delete"})
    task_id = create.json()["id"]

    res = await client.delete(f"/api/tasks/{task_id}")
    assert res.status_code == 204

    # Verify it's gone
    res = await client.get(f"/api/tasks/{task_id}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_filter_tasks_by_status(client):
    """Should filter tasks by status."""
    await client.post("/api/tasks", json={"title": "Open task"})
    create2 = await client.post("/api/tasks", json={"title": "Done task"})
    await client.post(f"/api/tasks/{create2.json()['id']}/complete")

    open_tasks = await client.get("/api/tasks?status=open")
    assert len(open_tasks.json()) == 1
    assert open_tasks.json()[0]["title"] == "Open task"

    completed_tasks = await client.get("/api/tasks?status=completed")
    assert len(completed_tasks.json()) == 1
    assert completed_tasks.json()[0]["title"] == "Done task"


@pytest.mark.asyncio
async def test_create_task_validation(client):
    """Should reject invalid task data."""
    # Empty title
    res = await client.post("/api/tasks", json={"title": ""})
    assert res.status_code == 422

    # Invalid urgency
    res = await client.post("/api/tasks", json={"title": "Ok", "urgency": "invalid"})
    assert res.status_code == 422
