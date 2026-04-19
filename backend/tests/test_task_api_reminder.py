"""Tests for the reminder_enabled field in the tasks API."""

import pytest
from datetime import date, timedelta


TODAY = date.today().isoformat()


@pytest.mark.asyncio
async def test_post_reminder_without_due_date_returns_422(client):
    res = await client.post("/api/tasks/", json={
        "title": "תזכורת ללא תאריך",
        "urgency": "medium",
        "reminder_enabled": True,
    })
    assert res.status_code == 422
    detail = res.json().get("detail", "")
    assert "לא ניתן להפעיל תזכורת ללא תאריך יעד" in str(detail)


@pytest.mark.asyncio
async def test_patch_clearing_due_date_while_reminder_on_returns_422(client):
    # Create task with due_date and reminder
    create = await client.post("/api/tasks/", json={
        "title": "משימה עם תזכורת",
        "urgency": "medium",
        "due_date": TODAY,
        "reminder_enabled": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    # PATCH to clear due_date while reminder is ON
    res = await client.patch(f"/api/tasks/{task_id}", json={"due_date": None})
    assert res.status_code == 422
    detail = res.json().get("detail", "")
    assert "לא ניתן להפעיל תזכורת ללא תאריך יעד" in str(detail)


@pytest.mark.asyncio
async def test_post_with_valid_reminder_and_due_date(client):
    res = await client.post("/api/tasks/", json={
        "title": "משימה עם תזכורת",
        "urgency": "high",
        "due_date": TODAY,
        "reminder_enabled": True,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["reminder_enabled"] is True
    task_id = data["id"]

    # GET echoes reminder_enabled=True
    get_res = await client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["reminder_enabled"] is True


@pytest.mark.asyncio
async def test_reminder_enabled_defaults_to_false(client):
    res = await client.post("/api/tasks/", json={
        "title": "ללא תזכורת",
        "urgency": "low",
    })
    assert res.status_code == 201
    assert res.json()["reminder_enabled"] is False
