"""add issue quality fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0005'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("issue_reports", sa.Column("order_number", sa.String(100), nullable=True))
    op.add_column("issue_reports", sa.Column("what_we_did", sa.Text(), nullable=True))
    op.add_column("issue_reports", sa.Column("compensation_required", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("issue_reports", "compensation_required")
    op.drop_column("issue_reports", "what_we_did")
    op.drop_column("issue_reports", "order_number")
