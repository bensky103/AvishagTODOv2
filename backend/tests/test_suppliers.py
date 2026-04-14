import pytest


@pytest.mark.asyncio
async def test_create_supplier(client):
    res = await client.post("/api/suppliers", json={"name": "Acme Corp"})
    assert res.status_code == 201
    assert res.json()["name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_list_suppliers(client):
    await client.post("/api/suppliers", json={"name": "Supplier A"})
    await client.post("/api/suppliers", json={"name": "Supplier B"})
    res = await client.get("/api/suppliers")
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_update_supplier(client):
    create = await client.post("/api/suppliers", json={"name": "Old name"})
    sid = create.json()["id"]
    res = await client.patch(f"/api/suppliers/{sid}", json={"name": "New name"})
    assert res.status_code == 200
    assert res.json()["name"] == "New name"


@pytest.mark.asyncio
async def test_delete_supplier(client):
    create = await client.post("/api/suppliers", json={"name": "To delete"})
    sid = create.json()["id"]
    res = await client.delete(f"/api/suppliers/{sid}")
    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_supplier_with_issues_fails(client):
    """Cannot delete a supplier that has linked issues."""
    sup = await client.post("/api/suppliers", json={"name": "Linked supplier"})
    sid = sup.json()["id"]
    await client.post("/api/issues", json={
        "supplier_id": sid,
        "product_name": "Widget",
        "arrival_date": "2026-01-01",
        "problem_description": "Broken",
    })
    res = await client.delete(f"/api/suppliers/{sid}")
    assert res.status_code == 409  # Conflict
