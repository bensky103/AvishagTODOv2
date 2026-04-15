from datetime import date
from difflib import SequenceMatcher
from typing import Optional

from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.services import task_service, supplier_service, issue_service


def _fuzzy_match(query: str, candidates: list, key=None, threshold: float = 0.4):
    """Find the best fuzzy match for a query string among candidates.

    Returns the best matching candidate or None if no match exceeds the threshold.
    Uses both substring containment (fast path) and SequenceMatcher (fuzzy path).
    """
    if not candidates:
        return None

    get_name = key or (lambda x: x)

    query_lower = query.lower().strip()

    # Fast path: exact match (case-insensitive)
    for c in candidates:
        if query_lower == get_name(c).lower().strip():
            return c

    # Score all candidates and pick the best
    best_candidate = None
    best_score = 0.0
    for c in candidates:
        name_lower = get_name(c).lower().strip()
        # Substring containment gets a boost but still competes with others
        if query_lower in name_lower or name_lower in query_lower:
            score = SequenceMatcher(None, query_lower, name_lower).ratio()
            score = max(score, 0.6)  # substring match is at least 0.6
        else:
            score = SequenceMatcher(None, query_lower, name_lower).ratio()
        if score > best_score:
            best_score = score
            best_candidate = c
    return best_candidate if best_score >= threshold else None


def get_agent_tools(session: AsyncSession) -> list:
    """Create tool functions bound to a specific database session."""

    @tool
    async def create_task(
        title: str,
        description: str = "",
        due_date: str = "",
        urgency: str = "",
    ) -> str:
        """Create a new task. All parameters must be provided by the user - do NOT assume or guess values.
        title: required. description: optional. due_date: YYYY-MM-DD format, ask user if not specified.
        urgency: must be one of low/medium/high/critical, ask user if not specified."""
        if not title.strip():
            return "שגיאה: חסר כותרת למשימה. שאלי את המשתמשת מה שם המשימה."
        if not urgency:
            return "שגיאה: לא צוינה דחיפות. שאלי את המשתמשת לבחור: low, medium, high, או critical."
        if urgency not in ("low", "medium", "high", "critical"):
            return f"שגיאה: דחיפות '{urgency}' לא תקינה. חייבת להיות אחת מ: low, medium, high, critical."
        parsed_date = None
        if due_date:
            try:
                parsed_date = date.fromisoformat(due_date)
            except ValueError:
                return f"שגיאה: תאריך '{due_date}' לא בפורמט תקין. השתמשי בפורמט YYYY-MM-DD."
        t = await task_service.create_task(
            session, title=title.strip(), description=description or None,
            due_date=parsed_date, urgency=urgency,
        )
        return f"משימה נוצרה: id={t.id}, כותרת='{t.title}', דחיפות={t.urgency}, תאריך יעד={t.due_date}"

    @tool
    async def list_tasks(
        status: str = "",
        urgency: str = "",
        due_before: str = "",
    ) -> str:
        """List tasks with optional filters. status: 'open' or 'completed'. urgency: low/medium/high/critical. due_before: YYYY-MM-DD."""
        parsed_date = None
        if due_before:
            try:
                parsed_date = date.fromisoformat(due_before)
            except ValueError:
                return f"שגיאה: תאריך '{due_before}' לא בפורמט תקין. השתמשי בפורמט YYYY-MM-DD."
        tasks = await task_service.list_tasks(
            session,
            status=status or None,
            urgency=urgency or None,
            due_before=parsed_date,
        )
        if not tasks:
            return "לא נמצאו משימות התואמות את הסינון."
        lines = []
        for t in tasks:
            status_mark = "\u2705" if t.is_completed else "\u2b1c"
            lines.append(f"{status_mark} [{t.id}] {t.title} (דחיפות={t.urgency}, תאריך יעד={t.due_date})")
        return "\n".join(lines)

    async def _resolve_task(task_id: int = 0, task_name: str = "") -> Task | str:
        """Find a task by ID or fuzzy name match. Returns the Task or an error string."""
        if task_id:
            task = await task_service.get_task(session, task_id)
            if not task:
                return f"שגיאה: משימה עם id {task_id} לא נמצאה."
            return task
        if task_name:
            tasks = await task_service.list_tasks(session)
            matched = _fuzzy_match(task_name, tasks, key=lambda t: t.title)
            if matched:
                return matched
            available = ", ".join(f"[{t.id}] {t.title}" for t in tasks[:10])
            return f"שגיאה: משימה '{task_name}' לא נמצאה. משימות זמינות: {available}"
        return "שגיאה: יש לספק task_id או task_name."

    @tool
    async def complete_task(task_id: int = 0, task_name: str = "") -> str:
        """Mark a task as completed. Provide task_id (numeric) OR task_name (fuzzy matched) to identify the task."""
        result = await _resolve_task(task_id, task_name)
        if isinstance(result, str):
            return result
        try:
            t = await task_service.complete_task(session, result.id)
            return f"משימה {t.id} '{t.title}' סומנה כהושלמה."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def reopen_task(task_id: int = 0, task_name: str = "") -> str:
        """Reopen a completed task, marking it as not completed. Provide task_id (numeric) OR task_name (fuzzy matched) to identify the task."""
        result = await _resolve_task(task_id, task_name)
        if isinstance(result, str):
            return result
        try:
            t = await task_service.reopen_task(session, result.id)
            return f"משימה {t.id} '{t.title}' נפתחה מחדש."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def update_task(
        task_id: int = 0,
        task_name: str = "",
        new_title: str = "",
        new_description: str = "",
        new_due_date: str = "",
        new_urgency: str = "",
    ) -> str:
        """Update an existing task's details. Identify the task by task_id or task_name (fuzzy matched).
        Provide any combination of: new_title, new_description, new_due_date (YYYY-MM-DD), new_urgency (low/medium/high/critical)."""
        result = await _resolve_task(task_id, task_name)
        if isinstance(result, str):
            return result
        if not any([new_title, new_description, new_due_date, new_urgency]):
            return "שגיאה: יש לספק לפחות שדה אחד לעדכון (new_title, new_description, new_due_date, new_urgency)."
        kwargs = {}
        if new_title:
            kwargs["title"] = new_title.strip()
        if new_description:
            kwargs["description"] = new_description
        if new_due_date:
            try:
                kwargs["due_date"] = date.fromisoformat(new_due_date)
            except ValueError:
                return f"שגיאה: תאריך '{new_due_date}' לא בפורמט תקין. השתמשי בפורמט YYYY-MM-DD."
        if new_urgency:
            if new_urgency not in ("low", "medium", "high", "critical"):
                return f"שגיאה: דחיפות '{new_urgency}' לא תקינה. חייבת להיות אחת מ: low, medium, high, critical."
            kwargs["urgency"] = new_urgency
        try:
            t = await task_service.update_task(session, result.id, **kwargs)
            return f"משימה {t.id} '{t.title}' עודכנה בהצלחה."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def delete_task(task_id: int = 0, task_name: str = "", confirmed: bool = False) -> str:
        """Delete a task permanently. Identify by task_id or task_name (fuzzy matched).
        You must first ask the user for confirmation, then call again with confirmed=True."""
        result = await _resolve_task(task_id, task_name)
        if isinstance(result, str):
            return result
        if not confirmed:
            return f"משימה '{result.title}' (id={result.id}) תימחק לצמיתות. בקשי אישור מהמשתמשת ואז קראי שוב עם confirmed=True."
        try:
            await task_service.delete_task(session, result.id)
            return f"משימה {result.id} '{result.title}' נמחקה בהצלחה."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def create_supplier(name: str, contact_info: str = "") -> str:
        """Register a new supplier."""
        try:
            s = await supplier_service.create_supplier(session, name=name, contact_info=contact_info or None)
            return f"ספק נוצר: id={s.id}, שם='{s.name}'"
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def list_suppliers() -> str:
        """List all registered suppliers."""
        suppliers = await supplier_service.list_suppliers(session)
        if not suppliers:
            return "אין ספקים רשומים במערכת."
        lines = [f"[{s.id}] {s.name} (איש קשר: {s.contact_info or 'לא צוין'})" for s in suppliers]
        return "\n".join(lines)

    async def _resolve_supplier(supplier_name: str):
        """Find a supplier by fuzzy name match. Returns (supplier, None) or (None, error_string)."""
        suppliers = await supplier_service.list_suppliers(session)
        matched = _fuzzy_match(supplier_name, suppliers, key=lambda s: s.name)
        if matched:
            return matched, None
        available = ", ".join(s.name for s in suppliers)
        return None, f"ספק '{supplier_name}' לא נמצא. ספקים זמינים: {available}"

    @tool
    async def update_supplier(supplier_name: str, new_name: str = "", new_contact_info: str = "") -> str:
        """Update an existing supplier's details. supplier_name is matched fuzzily. Provide new_name and/or new_contact_info to update."""
        if not new_name and not new_contact_info:
            return "שגיאה: יש לספק לפחות שדה אחד לעדכון (new_name או new_contact_info)."
        matched, error = await _resolve_supplier(supplier_name)
        if error:
            return error
        kwargs = {}
        if new_name:
            kwargs["name"] = new_name
        if new_contact_info:
            kwargs["contact_info"] = new_contact_info
        updated = await supplier_service.update_supplier(session, matched.id, **kwargs)
        return f"ספק עודכן: id={updated.id}, שם='{updated.name}', איש קשר='{updated.contact_info or 'לא צוין'}'"

    @tool
    async def delete_supplier(supplier_name: str, confirmed: bool = False) -> str:
        """Delete a supplier by name. supplier_name is matched fuzzily.
        If the supplier has unresolved issues, deletion will be blocked.
        If the supplier has NO issues, you must first ask the user for confirmation, then call again with confirmed=True."""
        matched, error = await _resolve_supplier(supplier_name)
        if error:
            return error

        if not confirmed:
            return f"ספק '{matched.name}' (id={matched.id}) יימחק לצמיתות. בקשי אישור מהמשתמשת ואז קראי שוב עם confirmed=True."

        try:
            await supplier_service.delete_supplier(session, matched.id)
            return f"ספק '{matched.name}' (id={matched.id}) נמחק בהצלחה."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def create_issue_report(
        supplier_name: str,
        product_name: str,
        problem_description: str,
        arrival_date: str = "",
        sku: str = "",
    ) -> str:
        """Create an issue report for a supplier problem. All required fields must be provided by the user - do NOT assume or guess values.
        supplier_name: required, matched fuzzily against existing suppliers.
        product_name: required - the name of the problematic product. Ask the user if not specified.
        problem_description: required.
        arrival_date: YYYY-MM-DD format, defaults to today if user doesn't specify.
        sku: optional."""
        if not supplier_name.strip():
            return "שגיאה: חסר שם ספק. שאלי את המשתמשת לאיזה ספק התקלה שייכת."
        if not product_name.strip():
            return "שגיאה: חסר שם מוצר. שאלי את המשתמשת מה שם המוצר (שם המוצר)."
        if not problem_description.strip():
            return "שגיאה: חסר תיאור הבעיה. שאלי את המשתמשת לתאר את הבעיה."

        matched, error = await _resolve_supplier(supplier_name)
        if error:
            return error

        parsed_date = date.today()
        if arrival_date:
            try:
                parsed_date = date.fromisoformat(arrival_date)
            except ValueError:
                return f"שגיאה: תאריך '{arrival_date}' לא בפורמט תקין. השתמשי בפורמט YYYY-MM-DD."

        issue = await issue_service.create_issue_report(
            session, supplier_id=matched.id, product_name=product_name.strip(),
            sku=sku or None, arrival_date=parsed_date,
            problem_description=problem_description.strip(),
        )
        return f"תקלה נוצרה: id={issue.id}, ספק='{matched.name}', מוצר='{product_name}', סטטוס={issue.status}"

    @tool
    async def list_issues(supplier_name: str = "", status: str = "") -> str:
        """List issue reports with optional filters. status: open/in_progress/resolved."""
        suppliers = await supplier_service.list_suppliers(session)
        supplier_names = {s.id: s.name for s in suppliers}

        supplier_id = None
        if supplier_name:
            matched = _fuzzy_match(supplier_name, suppliers, key=lambda s: s.name)
            if matched:
                supplier_id = matched.id

        issues = await issue_service.list_issue_reports(
            session, supplier_id=supplier_id, status=status or None,
        )
        if not issues:
            return "לא נמצאו תקלות התואמות את הסינון."
        lines = []
        for i in issues:
            action_count = len(i.action_items) if i.action_items else 0
            done_count = sum(1 for a in i.action_items if a.is_completed) if i.action_items else 0
            s_name = supplier_names.get(i.supplier_id, f"לא ידוע({i.supplier_id})")
            lines.append(
                f"[{i.id}] {i.product_name} (ספק={s_name}, סטטוס={i.status}, "
                f"פעולות={done_count}/{action_count}, תאריך={i.arrival_date})"
            )
        return "\n".join(lines)

    @tool
    async def add_action_item(
        issue_report_id: int,
        description: str,
        create_task: bool = False,
        task_description: str = "",
        urgency: str = "",
        due_date: str = "",
    ) -> str:
        """Add an action item to an issue report. Set create_task=True to also create a linked task in the TODO list.
        When create_task=True, you must ask the user for:
        1. urgency (low/medium/high/critical) - required
        2. task_description - suggest adding a description for the linked task (optional, can be left empty)
        3. due_date (optional, YYYY-MM-DD)"""
        if create_task and not urgency:
            return "שגיאה: כשיוצרים משימה מקושרת, חובה לציין דחיפות. שאלי את המשתמשת לבחור: low, medium, high, או critical."
        if create_task and urgency not in ("low", "medium", "high", "critical"):
            return f"שגיאה: דחיפות '{urgency}' לא תקינה. חייבת להיות אחת מ: low, medium, high, critical."
        parsed_date = None
        if due_date:
            try:
                parsed_date = date.fromisoformat(due_date)
            except ValueError:
                return f"שגיאה: תאריך '{due_date}' לא בפורמט תקין. השתמשי בפורמט YYYY-MM-DD."

        action = await issue_service.add_action_item(
            session, issue_report_id=issue_report_id,
            description=description, create_task=create_task,
            task_description=task_description,
            urgency=urgency or "medium", due_date=parsed_date,
        )
        task_info = f", משימה מקושרת id={action.task_id}" if action.task_id else ""
        return f"פעולה נוצרה: id={action.id}, תיאור='{description}'{task_info}"

    @tool
    async def list_action_items(issue_report_id: int = 0, issue_name: str = "") -> str:
        """List the action items of a specific issue report.
        Provide issue_report_id (numeric) OR issue_name (fuzzy matched against product_name) to identify the issue."""
        if not issue_report_id and not issue_name:
            return "שגיאה: יש לספק issue_report_id או issue_name כדי לזהות את התקלה."

        if issue_report_id:
            issue = await issue_service.get_issue_report(session, issue_report_id)
            if not issue:
                return f"שגיאה: תקלה עם id {issue_report_id} לא נמצאה."
        else:
            issues = await issue_service.list_issue_reports(session)
            matched = _fuzzy_match(issue_name, issues, key=lambda i: i.product_name)
            if not matched:
                available = ", ".join(f"[{i.id}] {i.product_name}" for i in issues[:10])
                return f"שגיאה: תקלה '{issue_name}' לא נמצאה. תקלות זמינות: {available}"
            issue = matched

        if not issue.action_items:
            return f"לתקלה [{issue.id}] '{issue.product_name}' אין פעולות עדיין."

        lines = [f"פעולות לתקלה [{issue.id}] '{issue.product_name}':"]
        for a in issue.action_items:
            status_mark = "\u2705" if a.is_completed else "\u2b1c"
            task_info = f" (משימה מקושרת #{a.task_id})" if a.task_id else ""
            lines.append(f"{status_mark} [{a.id}] {a.description}{task_info}")
        return "\n".join(lines)

    @tool
    async def resolve_issue(issue_report_id: int) -> str:
        """Mark an issue report as resolved."""
        try:
            issue = await issue_service.resolve_issue_report(session, issue_report_id)
            return f"תקלה {issue.id} סומנה כפתורה."
        except ValueError as e:
            return f"שגיאה: {e}"

    @tool
    async def reopen_issue(issue_report_id: int) -> str:
        """Reopen a resolved issue report, marking it as open again."""
        try:
            issue = await issue_service.reopen_issue_report(session, issue_report_id)
            return f"תקלה {issue.id} '{issue.product_name}' נפתחה מחדש."
        except ValueError as e:
            return f"שגיאה: {e}"

    return [
        create_task, list_tasks, complete_task, reopen_task, update_task, delete_task,
        create_supplier, list_suppliers, update_supplier, delete_supplier,
        create_issue_report, list_issues, list_action_items,
        add_action_item, resolve_issue, reopen_issue,
    ]
