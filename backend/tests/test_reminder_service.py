"""Tests for reminder_service.format_reminder_message (pure logic, no DB)."""

import pytest
from datetime import date
from unittest.mock import MagicMock

from app.services.reminder_service import format_reminder_message


def _task(title: str, urgency: str, due_date: date) -> MagicMock:
    t = MagicMock()
    t.title = title
    t.urgency = urgency
    t.due_date = due_date
    return t


TODAY = date(2026, 4, 19)
YESTERDAY = date(2026, 4, 18)
TWO_DAYS_AGO = date(2026, 4, 17)


class TestFormatReminderMessage:
    def test_empty_lists_returns_none(self):
        assert format_reminder_message([], [], TODAY) is None

    def test_exact_string_match_today_and_overdue(self):
        today_tasks = [
            _task("משימה קריטית", "critical", TODAY),
            _task("משימה רגילה", "medium", TODAY),
        ]
        overdue_tasks = [
            _task("משימה איחור", "high", YESTERDAY),
        ]
        msg = format_reminder_message(today_tasks, overdue_tasks, TODAY)
        assert msg is not None
        lines = msg.split("\n")
        assert lines[0] == "🔔 תזכורת יומית"
        # Today section
        assert any("להיום (2)" in l for l in lines)
        assert any("🔥 משימה קריטית" in l for l in lines)
        assert any("🟡 משימה רגילה" in l for l in lines)
        # Overdue section
        assert any("באיחור (1)" in l for l in lines)
        assert any("• משימה איחור — 1 ימים" in l for l in lines)

    def test_urgency_sort_critical_above_low(self):
        # format_reminder_message receives already-sorted lists (sorted by list_due_reminders)
        # Pass them already sorted: critical first, then low
        today_tasks = [
            _task("קריטי", "critical", TODAY),
            _task("נמוך", "low", TODAY),
        ]
        msg = format_reminder_message(today_tasks, [], TODAY)
        assert msg is not None
        lines = msg.split("\n")
        today_lines = [l for l in lines if l.startswith(("🔥", "⚡", "🟡", "·"))]
        assert today_lines[0].startswith("🔥")  # critical first
        assert today_lines[1].startswith("·")   # low last

    def test_overdue_sort_oldest_first(self):
        # format_reminder_message receives already-sorted lists (sorted by list_due_reminders)
        # Pass them already sorted: oldest first
        overdue_tasks = [
            _task("ישן יותר", "medium", TWO_DAYS_AGO),
            _task("חדש יותר", "medium", YESTERDAY),
        ]
        msg = format_reminder_message([], overdue_tasks, TODAY)
        assert msg is not None
        lines = msg.split("\n")
        overdue_lines = [l for l in lines if l.startswith("•")]
        assert "ישן יותר" in overdue_lines[0]  # oldest first
        assert "חדש יותר" in overdue_lines[1]

    def test_days_overdue_yesterday_is_1(self):
        overdue_tasks = [_task("ישנה", "low", YESTERDAY)]
        msg = format_reminder_message([], overdue_tasks, TODAY)
        assert msg is not None
        assert "1 ימים" in msg

    def test_section_omission_only_overdue(self):
        overdue_tasks = [_task("איחור", "high", YESTERDAY)]
        msg = format_reminder_message([], overdue_tasks, TODAY)
        assert msg is not None
        assert "להיום" not in msg
        assert "באיחור" in msg

    def test_section_omission_only_today(self):
        today_tasks = [_task("היום", "medium", TODAY)]
        msg = format_reminder_message(today_tasks, [], TODAY)
        assert msg is not None
        assert "להיום" in msg
        assert "באיחור" not in msg
