"""Tests for agent issue-tool rename tolerance and new quality fields."""
import pytest
from datetime import date

from app.agent.tools import get_agent_tools
from app.models.issue_report import IssueReport
from app.models.supplier import Supplier
from app.services import issue_service


TODAY = date.today()


@pytest.fixture
async def supplier(session):
    s = Supplier(name="Test Supplier")
    session.add(s)
    await session.commit()
    await session.refresh(s)
    return s


# ---------------------------------------------------------------------------
# Rename-tolerance: old word "תקלה" still triggers issue creation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_issue_via_old_term_tiklah(session, supplier):
    """create_issue_report tool still works when called with old-term context."""
    tools = get_agent_tools(session)
    create_tool = next(t for t in tools if t.name == "create_issue_report")

    # The tool itself does not parse Hebrew text, but it should succeed
    # when invoked with valid args (the prompt layer handles synonym tolerance).
    result = await create_tool.ainvoke({
        "supplier_name": supplier.name,
        "product_name": "Widget A",
        "problem_description": "תקלה בטיב המוצר",  # uses old term in description
        "arrival_date": TODAY.isoformat(),
    })
    assert "נוצרה" in result or "id=" in result


@pytest.mark.asyncio
async def test_create_issue_via_new_term_baya(session, supplier):
    """create_issue_report tool works normally (new Hebrew term in description)."""
    tools = get_agent_tools(session)
    create_tool = next(t for t in tools if t.name == "create_issue_report")

    result = await create_tool.ainvoke({
        "supplier_name": supplier.name,
        "product_name": "Widget B",
        "problem_description": "בעיית איכות בחומרים",
        "arrival_date": TODAY.isoformat(),
    })
    assert "נוצרה" in result or "id=" in result


# ---------------------------------------------------------------------------
# New quality fields via agent tool
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_issue_with_order_number_via_tool(session, supplier):
    """create_issue_report tool passes order_number to the service layer."""
    tools = get_agent_tools(session)
    create_tool = next(t for t in tools if t.name == "create_issue_report")

    result = await create_tool.ainvoke({
        "supplier_name": supplier.name,
        "product_name": "Widget C",
        "problem_description": "בעיה",
        "arrival_date": TODAY.isoformat(),
        "order_number": "2043",
    })
    assert "נוצרה" in result or "id=" in result

    # Verify the value was persisted
    issues = await issue_service.list_issue_reports(session)
    matching = [i for i in issues if i.product_name == "Widget C"]
    assert len(matching) == 1
    assert matching[0].order_number == "2043"


@pytest.mark.asyncio
async def test_list_issues_tool_still_works(session, supplier):
    """list_issues tool still returns results after rename (no regression)."""
    # Seed an issue
    await issue_service.create_issue_report(
        session,
        supplier_id=supplier.id,
        product_name="Widget D",
        arrival_date=TODAY,
        problem_description="Some problem",
    )

    tools = get_agent_tools(session)
    list_tool = next(t for t in tools if t.name == "list_issues")
    result = await list_tool.ainvoke({})
    assert "Widget D" in result
