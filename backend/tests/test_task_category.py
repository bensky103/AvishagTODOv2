"""Tests for task category field — API-level (service + HTTP)."""
import pytest


@pytest.mark.asyncio
async def test_create_task_default_category(client):
    """POST /api/tasks without category defaults to 'work'."""
    resp = await client.post("/api/tasks/", json={
        "title": "משימה ללא קטגוריה",
        "urgency": "medium",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["category"] == "work"


@pytest.mark.asyncio
async def test_create_task_work_category(client):
    resp = await client.post("/api/tasks/", json={
        "title": "משימת עבודה",
        "urgency": "medium",
        "category": "work",
    })
    assert resp.status_code == 201
    assert resp.json()["category"] == "work"


@pytest.mark.asyncio
async def test_create_task_vaad_category(client):
    resp = await client.post("/api/tasks/", json={
        "title": "משימת ועד בית",
        "urgency": "low",
        "category": "vaad",
    })
    assert resp.status_code == 201
    assert resp.json()["category"] == "vaad"


@pytest.mark.asyncio
async def test_create_task_personal_category(client):
    resp = await client.post("/api/tasks/", json={
        "title": "משימה אישית",
        "urgency": "high",
        "category": "personal",
    })
    assert resp.status_code == 201
    assert resp.json()["category"] == "personal"


@pytest.mark.asyncio
async def test_create_task_invalid_category(client):
    """POST with invalid category → 422."""
    resp = await client.post("/api/tasks/", json={
        "title": "משימה עם קטגוריה שגויה",
        "urgency": "medium",
        "category": "other",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_filter_by_vaad_category(client):
    """GET /api/tasks?category=vaad returns only vaad rows."""
    # Create one vaad and one personal task
    await client.post("/api/tasks/", json={"title": "ועד", "urgency": "low", "category": "vaad"})
    await client.post("/api/tasks/", json={"title": "אישי", "urgency": "low", "category": "personal"})

    resp = await client.get("/api/tasks/?category=vaad")
    assert resp.status_code == 200
    tasks = resp.json()
    assert all(t["category"] == "vaad" for t in tasks)
    assert any(t["title"] == "ועד" for t in tasks)
    assert not any(t["title"] == "אישי" for t in tasks)


@pytest.mark.asyncio
async def test_filter_category_all_returns_all(client):
    """GET /api/tasks?category=all returns all rows (param ignored)."""
    await client.post("/api/tasks/", json={"title": "עבודה", "urgency": "low", "category": "work"})
    await client.post("/api/tasks/", json={"title": "ועד", "urgency": "low", "category": "vaad"})
    await client.post("/api/tasks/", json={"title": "אישי", "urgency": "low", "category": "personal"})

    resp_all = await client.get("/api/tasks/?category=all")
    resp_none = await client.get("/api/tasks/")
    assert resp_all.status_code == 200
    assert resp_none.status_code == 200
    assert len(resp_all.json()) == len(resp_none.json())


@pytest.mark.asyncio
async def test_filter_category_and_status_intersection(client):
    """GET /api/tasks?category=personal&status=open returns intersection."""
    # Create personal open, personal completed, work open
    r1 = await client.post("/api/tasks/", json={"title": "אישי פתוח", "urgency": "low", "category": "personal"})
    r2 = await client.post("/api/tasks/", json={"title": "אישי סגור", "urgency": "low", "category": "personal"})
    await client.post("/api/tasks/", json={"title": "עבודה פתוח", "urgency": "low", "category": "work"})

    # Complete the second personal task
    task_id = r2.json()["id"]
    await client.post(f"/api/tasks/{task_id}/complete")

    resp = await client.get("/api/tasks/?category=personal&status=open")
    assert resp.status_code == 200
    tasks = resp.json()
    assert all(t["category"] == "personal" and not t["is_completed"] for t in tasks)
    assert len(tasks) == 1
    assert tasks[0]["title"] == "אישי פתוח"


@pytest.mark.asyncio
async def test_update_task_category(client):
    """PATCH /api/tasks/{id} can change category."""
    r = await client.post("/api/tasks/", json={"title": "משימה", "urgency": "medium", "category": "work"})
    task_id = r.json()["id"]

    resp = await client.patch(f"/api/tasks/{task_id}", json={"category": "personal"})
    assert resp.status_code == 200
    assert resp.json()["category"] == "personal"
