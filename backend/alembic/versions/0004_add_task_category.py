"""add task category column

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0004'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column(
            "category",
            sa.Enum("work", "vaad", "personal", name="task_category_enum"),
            nullable=False,
            server_default="work",
        ),
    )
    op.create_index("ix_tasks_category", "tasks", ["category"])


def downgrade() -> None:
    op.drop_index("ix_tasks_category", table_name="tasks")
    op.drop_column("tasks", "category")
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS task_category_enum")
