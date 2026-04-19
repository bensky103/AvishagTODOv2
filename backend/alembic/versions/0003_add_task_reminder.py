"""add task reminder_enabled column

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_tasks_reminder_enabled", "tasks", ["reminder_enabled"])


def downgrade() -> None:
    op.drop_index("ix_tasks_reminder_enabled", table_name="tasks")
    op.drop_column("tasks", "reminder_enabled")
