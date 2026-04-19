"""Tests for the is_recurring_monthly field and advance-in-place toggle behavior."""

import pytest
from datetime import date

from app.services.task_service import _add_one_month


# ---------------------------------------------------------------------------
# Unit tests for _add_one_month helper (pure logic, no DB)
# ---------------------------------------------------------------------------

class TestAddOneMonth:
    def test_regular_month(self):
        assert _add_one_month(date(2026, 5, 15)) == date(2026, 6, 15)

    def test_december_wraps_to_january_next_year(self):
        assert _add_one_month(date(2026, 12, 15)) == date(2027, 1, 15)

    def test_jan31_clamps_to_feb28(self):
        assert _add_one_month(date(2026, 1, 31)) == date(2026, 2, 28)

    def test_jan31_clamps_to_feb29_leap_year(self):
        assert _add_one_month(date(2024, 1, 31)) == date(2024, 2, 29)

    def test_march31_to_april30(self):
        assert _add_one_month(date(2026, 3, 31)) == date(2026, 4, 30)

    def test_dec31_to_jan31(self):
        assert _add_one_month(date(2026, 12, 31)) == date(2027, 1, 31)


# ---------------------------------------------------------------------------
# API integration tests (require `client` fixture)
# ---------------------------------------------------------------------------

TODAY = date.today().isoformat()


@pytest.mark.asyncio
async def test_post_recurring_without_due_date_returns_422(client):
    res = await client.post("/api/tasks/", json={
        "title": "קבועה ללא תאריך",
        "urgency": "medium",
        "is_recurring_monthly": True,
    })
    assert res.status_code == 422
    detail = res.json().get("detail", "")
    assert "לא ניתן להגדיר משימה קבועה ללא תאריך יעד" in str(detail)


@pytest.mark.asyncio
async def test_patch_clearing_due_date_on_recurring_returns_422(client):
    create = await client.post("/api/tasks/", json={
        "title": "קבועה עם תאריך",
        "urgency": "medium",
        "due_date": TODAY,
        "is_recurring_monthly": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    res = await client.patch(f"/api/tasks/{task_id}", json={"due_date": None})
    assert res.status_code == 422
    detail = res.json().get("detail", "")
    assert "לא ניתן להגדיר משימה קבועה ללא תאריך יעד" in str(detail)


@pytest.mark.asyncio
async def test_post_recurring_with_due_date_succeeds_and_echoes(client):
    res = await client.post("/api/tasks/", json={
        "title": "קבועה תקינה",
        "urgency": "high",
        "due_date": TODAY,
        "is_recurring_monthly": True,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["is_recurring_monthly"] is True
    task_id = data["id"]

    get_res = await client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["is_recurring_monthly"] is True


@pytest.mark.asyncio
async def test_is_recurring_monthly_defaults_to_false(client):
    res = await client.post("/api/tasks/", json={
        "title": "רגילה",
        "urgency": "low",
    })
    assert res.status_code == 201
    assert res.json()["is_recurring_monthly"] is False


@pytest.mark.asyncio
async def test_filter_recurring_true_returns_only_recurring(client):
    # Create one recurring and one regular task
    await client.post("/api/tasks/", json={
        "title": "קבועה",
        "urgency": "medium",
        "due_date": TODAY,
        "is_recurring_monthly": True,
    })
    await client.post("/api/tasks/", json={
        "title": "רגילה",
        "urgency": "medium",
    })

    res = await client.get("/api/tasks/?is_recurring_monthly=true")
    assert res.status_code == 200
    tasks = res.json()
    assert all(t["is_recurring_monthly"] is True for t in tasks)
    titles = [t["title"] for t in tasks]
    assert "קבועה" in titles
    assert "רגילה" not in titles


@pytest.mark.asyncio
async def test_toggle_complete_recurring_advances_date_stays_open(client):
    # Create recurring task with due_date 2026-05-15
    create = await client.post("/api/tasks/", json={
        "title": "קבועה מאי",
        "urgency": "medium",
        "due_date": "2026-05-15",
        "is_recurring_monthly": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    data = res.json()
    assert data["is_completed"] is False
    assert data["due_date"] == "2026-06-15"


@pytest.mark.asyncio
async def test_toggle_complete_recurring_jan31_advances_to_feb28(client):
    create = await client.post("/api/tasks/", json={
        "title": "קבועה ינואר 31",
        "urgency": "medium",
        "due_date": "2026-01-31",
        "is_recurring_monthly": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    data = res.json()
    assert data["is_completed"] is False
    assert data["due_date"] == "2026-02-28"


@pytest.mark.asyncio
async def test_toggle_complete_recurring_jan31_leap_year_advances_to_feb29(client):
    create = await client.post("/api/tasks/", json={
        "title": "קבועה ינואר 31 שנת מעבר",
        "urgency": "medium",
        "due_date": "2024-01-31",
        "is_recurring_monthly": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    data = res.json()
    assert data["is_completed"] is False
    assert data["due_date"] == "2024-02-29"


@pytest.mark.asyncio
async def test_toggle_complete_recurring_dec15_advances_to_jan15_next_year(client):
    create = await client.post("/api/tasks/", json={
        "title": "קבועה דצמבר",
        "urgency": "medium",
        "due_date": "2026-12-15",
        "is_recurring_monthly": True,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]

    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    data = res.json()
    assert data["is_completed"] is False
    assert data["due_date"] == "2027-01-15"


@pytest.mark.asyncio
async def test_toggle_complete_non_recurring_standard_behavior(client):
    create = await client.post("/api/tasks/", json={
        "title": "רגילה",
        "urgency": "medium",
        "due_date": TODAY,
        "is_recurring_monthly": False,
    })
    assert create.status_code == 201
    task_id = create.json()["id"]
    original_due_date = create.json()["due_date"]

    res = await client.post(f"/api/tasks/{task_id}/complete")
    assert res.status_code == 200
    data = res.json()
    assert data["is_completed"] is True
    assert data["due_date"] == original_due_date  # due_date unchanged
