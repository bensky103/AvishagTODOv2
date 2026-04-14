from typing import Optional

import structlog
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supplier import Supplier

logger = structlog.get_logger("supplier_service")


async def create_supplier(
    session: AsyncSession,
    name: str,
    contact_info: Optional[str] = None,
    notes: Optional[str] = None,
) -> Supplier:
    # Check for duplicate by name (case-insensitive)
    existing = (await session.execute(
        select(Supplier).where(func.lower(Supplier.name) == name.strip().lower())
    )).scalar_one_or_none()
    if existing:
        raise ValueError("ספק כבר קיים במערכת")

    supplier = Supplier(name=name.strip(), contact_info=contact_info, notes=notes)
    session.add(supplier)
    await session.commit()
    await session.refresh(supplier)
    logger.info("supplier_created", supplier_id=supplier.id)
    return supplier


async def get_supplier(session: AsyncSession, supplier_id: int) -> Optional[Supplier]:
    return await session.get(Supplier, supplier_id)


async def list_suppliers(session: AsyncSession, skip: int = 0, limit: int = 100) -> list[Supplier]:
    stmt = select(Supplier).order_by(Supplier.name).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def update_supplier(session: AsyncSession, supplier_id: int, **kwargs) -> Supplier:
    supplier = await session.get(Supplier, supplier_id)
    if not supplier:
        raise ValueError(f"Supplier {supplier_id} not found")
    for key, value in kwargs.items():
        setattr(supplier, key, value)
    await session.commit()
    await session.refresh(supplier)
    logger.info("supplier_updated", supplier_id=supplier_id)
    return supplier


async def delete_supplier(session: AsyncSession, supplier_id: int) -> None:
    supplier = await session.get(Supplier, supplier_id)
    if not supplier:
        raise ValueError(f"Supplier {supplier_id} not found")
    # Only block deletion if there are unresolved issues
    from app.models.issue_report import IssueReport
    unresolved_count = (await session.execute(
        select(func.count()).where(
            IssueReport.supplier_id == supplier_id,
            IssueReport.status != "resolved",
        )
    )).scalar()
    if unresolved_count > 0:
        raise ValueError(f"לא ניתן למחוק ספק עם {unresolved_count} תקלות פתוחות")
    await session.delete(supplier)
    await session.commit()
    logger.info("supplier_deleted", supplier_id=supplier_id)
