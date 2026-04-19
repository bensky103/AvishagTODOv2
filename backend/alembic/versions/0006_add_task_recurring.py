"""add task is_recurring_monthly column

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0006'
down_revision: Union[str, None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("is_recurring_monthly", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_tasks_is_recurring_monthly", "tasks", ["is_recurring_monthly"])


def downgrade() -> None:
    op.drop_index("ix_tasks_is_recurring_monthly", table_name="tasks")
    op.drop_column("tasks", "is_recurring_monthly")
