"""Tests for the three new quality-issue fields: order_number, what_we_did, compensation_required."""
import pytest
from datetime import date

from app.models.supplier import Supplier
from app.services import issue_service


TODAY = date.today()


@pytest.fixture
async def supplier(session):
    s = Supplier(name="Quality Supplier")
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


@pytest.fixture
async def base_payload(supplier):
    return {
        "supplier_id": supplier.id,
        "product_name": "Widget X",
        "arrival_date": TODAY,
        "problem_description": "Defective batch",
    }


# ---------------------------------------------------------------------------
# Create with all three new fields
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_issue_with_all_quality_fields(session, supplier):
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget X",
        arrival_date=TODAY,
        problem_description="Defective batch",
        order_number="ORD-2043",
        what_we_did="Returned to supplier",
        compensation_required="החלפה, זיכוי 200 ₪",
    )
    assert issue.order_number == "ORD-2043"
    assert issue.what_we_did == "Returned to supplier"
    assert issue.compensation_required == "החלפה, זיכוי 200 ₪"


# ---------------------------------------------------------------------------
# Create without new fields → all NULL
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_issue_without_quality_fields_defaults_null(session, supplier):
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget Y",
        arrival_date=TODAY,
        problem_description="Another problem",
    )
    fetched = await issue_service.get_issue_report(session, issue.id)
    assert fetched.order_number is None
    assert fetched.what_we_did is None
    assert fetched.compensation_required is None


# ---------------------------------------------------------------------------
# Patch one field at a time — others remain unchanged
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_patch_order_number_only(session, supplier):
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget A",
        arrival_date=TODAY,
        problem_description="Problem A",
    )
    updated = await issue_service.update_issue(session, issue.id, order_number="ORD-9999")
    assert updated.order_number == "ORD-9999"
    assert updated.what_we_did is None
    assert updated.compensation_required is None


@pytest.mark.asyncio
async def test_patch_what_we_did_only(session, supplier):
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget B",
        arrival_date=TODAY,
        problem_description="Problem B",
    )
    updated = await issue_service.update_issue(session, issue.id, what_we_did="Called supplier")
    assert updated.what_we_did == "Called supplier"
    assert updated.order_number is None
    assert updated.compensation_required is None


@pytest.mark.asyncio
async def test_patch_compensation_only(session, supplier):
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget C",
        arrival_date=TODAY,
        problem_description="Problem C",
    )
    updated = await issue_service.update_issue(session, issue.id, compensation_required="זיכוי")
    assert updated.compensation_required == "זיכוי"
    assert updated.order_number is None
    assert updated.what_we_did is None


@pytest.mark.asyncio
async def test_patch_one_does_not_reset_others(session, supplier):
    """Patching one field doesn't reset the others."""
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget D",
        arrival_date=TODAY,
        problem_description="Problem D",
        order_number="ORD-1",
        what_we_did="Inspected",
        compensation_required="None required",
    )
    updated = await issue_service.update_issue(session, issue.id, order_number="ORD-2")
    assert updated.order_number == "ORD-2"
    assert updated.what_we_did == "Inspected"
    assert updated.compensation_required == "None required"


# ---------------------------------------------------------------------------
# Empty string → stored as NULL (blank-to-null trimming)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_patch_empty_string_stores_null(session, supplier):
    """An empty string for a nullable text field should be stored as NULL."""
    issue = await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget E",
        arrival_date=TODAY,
        problem_description="Problem E",
        order_number="ORD-1",
        what_we_did="Something",
        compensation_required="Something",
    )
    updated = await issue_service.update_issue(
        session, issue.id,
        order_number="",
        what_we_did="   ",  # whitespace only → null
        compensation_required="",
    )
    assert updated.order_number is None
    assert updated.what_we_did is None
    assert updated.compensation_required is None
