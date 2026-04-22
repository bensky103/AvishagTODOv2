import pytest


@pytest.mark.asyncio
async def test_create_issue(client):
    res = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget A",
        "arrival_date": "2026-04-01",
        "problem_description": "Arrived damaged",
    })
    assert res.status_code == 201
    assert res.json()["product_name"] == "Widget A"
    assert res.json()["status"] == "open"


@pytest.mark.asyncio
async def test_resolve_and_reopen_issue(client):
    create = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = create.json()["id"]

    res = await client.post(f"/api/issues/{iid}/resolve")
    assert res.json()["status"] == "resolved"

    res = await client.post(f"/api/issues/{iid}/reopen")
    assert res.json()["status"] == "open"


@pytest.mark.asyncio
async def test_add_action_item(client):
    issue = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = issue.json()["id"]

    res = await client.post(f"/api/issues/{iid}/action-items", json={
        "description": "Call supplier",
    })
    assert res.status_code == 201
    assert res.json()["description"] == "Call supplier"


@pytest.mark.asyncio
async def test_action_item_with_linked_task(client):
    issue = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = issue.json()["id"]

    res = await client.post(f"/api/issues/{iid}/action-items", json={
        "description": "Follow up",
        "create_task": True,
    })
    assert res.status_code == 201
    assert res.json()["task_id"] is not None


@pytest.mark.asyncio
async def test_complete_action_item(client):
    issue = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = issue.json()["id"]

    action = await client.post(f"/api/issues/{iid}/action-items", json={
        "description": "Do something",
    })
    aid = action.json()["id"]

    res = await client.post(f"/api/issues/action-items/{aid}/complete")
    assert res.status_code == 200
    assert res.json()["is_completed"] is True


@pytest.mark.asyncio
async def test_delete_issue(client):
    issue = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = issue.json()["id"]

    res = await client.delete(f"/api/issues/{iid}")
    assert res.status_code == 204

    res = await client.get(f"/api/issues/{iid}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_issue_cascades_action_items(client):
    """Deleting an issue should delete its action items."""
    issue = await client.post("/api/issues/", json={
        "supplier_name": "Test Supplier",
        "product_name": "Widget",
        "arrival_date": "2026-04-01",
        "problem_description": "Problem",
    })
    iid = issue.json()["id"]

    await client.post(f"/api/issues/{iid}/action-items", json={
        "description": "Action 1",
    })

    # Delete the issue
    res = await client.delete(f"/api/issues/{iid}")
    assert res.status_code == 204

    # The issue (and its action items) should be gone
    res = await client.get(f"/api/issues/{iid}")
    assert res.status_code == 404
