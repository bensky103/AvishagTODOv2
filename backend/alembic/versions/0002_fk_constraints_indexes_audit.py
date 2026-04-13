"""add FK constraints, indexes, audit fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Audit fields
    op.add_column('tasks', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('suppliers', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('issue_reports', sa.Column('updated_at', sa.DateTime(), nullable=True))

    # Indexes for common query patterns
    op.create_index('ix_tasks_is_completed', 'tasks', ['is_completed'])
    op.create_index('ix_tasks_created_at', 'tasks', ['created_at'])
    op.create_index('ix_tasks_urgency', 'tasks', ['urgency'])
    op.create_index('ix_issue_reports_supplier_id', 'issue_reports', ['supplier_id'])
    op.create_index('ix_issue_reports_status', 'issue_reports', ['status'])
    op.create_index('ix_issue_reports_created_at', 'issue_reports', ['created_at'])
    op.create_index('ix_action_items_issue_report_id', 'action_items', ['issue_report_id'])
    op.create_index('ix_action_items_task_id', 'action_items', ['task_id'])


def downgrade() -> None:
    op.drop_index('ix_action_items_task_id')
    op.drop_index('ix_action_items_issue_report_id')
    op.drop_index('ix_issue_reports_created_at')
    op.drop_index('ix_issue_reports_status')
    op.drop_index('ix_issue_reports_supplier_id')
    op.drop_index('ix_tasks_urgency')
    op.drop_index('ix_tasks_created_at')
    op.drop_index('ix_tasks_is_completed')
    op.drop_column('issue_reports', 'updated_at')
    op.drop_column('suppliers', 'updated_at')
    op.drop_column('tasks', 'updated_at')
