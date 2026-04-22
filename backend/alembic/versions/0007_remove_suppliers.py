"""remove suppliers table; inline supplier_name on issue_reports

Revision ID: 0007
Revises: 0006
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0007'
down_revision: Union[str, None] = '0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop suppliers table; replace issue_reports.supplier_id FK with inline
    issue_reports.supplier_name TEXT NOT NULL, backfilled from suppliers.name.
    """
    # 1. Add nullable supplier_name column so we can backfill before enforcing NOT NULL.
    op.add_column(
        "issue_reports",
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
    )

    # 2. Backfill supplier_name from the suppliers table via supplier_id.
    #    Any row whose supplier_id does not resolve (shouldn't happen given the FK)
    #    falls back to a placeholder so the subsequent NOT NULL constraint holds.
    op.execute(
        """
        UPDATE issue_reports
        SET supplier_name = COALESCE(
            (SELECT s.name FROM suppliers s WHERE s.id = issue_reports.supplier_id),
            'לא ידוע'
        )
        """
    )

    # 3. Drop the index on supplier_id (added in 0002) before dropping the column.
    with op.batch_alter_table("issue_reports") as batch_op:
        batch_op.drop_index("ix_issue_reports_supplier_id")

    # 4. Drop supplier_id column and enforce NOT NULL on supplier_name.
    #    Use batch mode so SQLite can recreate the table without the FK column.
    with op.batch_alter_table("issue_reports") as batch_op:
        batch_op.drop_column("supplier_id")
        batch_op.alter_column(
            "supplier_name",
            existing_type=sa.String(length=255),
            nullable=False,
        )

    # 5. Drop the suppliers table entirely.
    op.drop_table("suppliers")


def downgrade() -> None:
    """Recreate suppliers table; restore issue_reports.supplier_id FK from
    inlined supplier_name (creating supplier rows as needed); drop supplier_name.
    """
    # 1. Recreate the suppliers table with the same shape it had at the end of 0002.
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("contact_info", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2. Populate suppliers with the distinct names currently inlined on issue_reports.
    op.execute(
        """
        INSERT INTO suppliers (name)
        SELECT DISTINCT supplier_name
        FROM issue_reports
        WHERE supplier_name IS NOT NULL
        """
    )

    # 3. Add supplier_id back as nullable, backfill, then enforce NOT NULL + FK + index.
    with op.batch_alter_table("issue_reports") as batch_op:
        batch_op.add_column(sa.Column("supplier_id", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE issue_reports
        SET supplier_id = (
            SELECT s.id FROM suppliers s WHERE s.name = issue_reports.supplier_name
        )
        """
    )

    with op.batch_alter_table("issue_reports") as batch_op:
        batch_op.alter_column(
            "supplier_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
        batch_op.create_foreign_key(
            "fk_issue_reports_supplier_id_suppliers",
            "suppliers",
            ["supplier_id"],
            ["id"],
        )
        batch_op.drop_column("supplier_name")

    op.create_index(
        "ix_issue_reports_supplier_id",
        "issue_reports",
        ["supplier_id"],
    )
