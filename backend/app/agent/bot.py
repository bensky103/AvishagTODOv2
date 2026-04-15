import html
import re

import structlog
from telegram import Update
from telegram.ext import Application, MessageHandler, CommandHandler, filters, ContextTypes

from langchain_core.messages import HumanMessage, AIMessage

from app.config import settings
from app.database import async_session
from app.agent.agent import run_agent

logger = structlog.get_logger("telegram")


MAX_HISTORY_TOKENS_ESTIMATE = 3000  # rough char-based estimate (1 token ≈ 4 chars)

_BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def _markdown_to_html(text: str) -> str:
    """Convert **bold** markdown to HTML <b> tags for Telegram HTML parse mode."""
    text = html.escape(text)
    return _BOLD_RE.sub(r"<b>\1</b>", text)

HELP_TEXT = r"""🤖 *בוטי \- עוזר ניהול רכש*

הנה מה שאני יכול לעשות:

📋 *משימות*
• יצירת משימה חדשה
• הצגת רשימת משימות \(פתוחות/סגורות\)
• סימון משימה כהושלמה
• עדכון או מחיקת משימה
• פתיחה מחדש של משימה שהושלמה

🏢 *ספקים*
• יצירת ספק חדש
• הצגת רשימת ספקים
• עדכון פרטי ספק
• מחיקת ספק

⚠️ *תקלות*
• פתיחת תקלה חדשה על ספק
• הצגת רשימת תקלות
• הוספת פעולות נדרשות לתקלה
• סימון תקלה כפתורה

💡 *טיפים*
• אפשר לכתוב בעברית או באנגלית
• אפשר לבקש כמה פעולות בהודעה אחת
• אני מזהה שמות ספקים גם אם כתבת חלקית
"""


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    if update.effective_user.id != settings.telegram_allowed_user_id:
        return
    await update.message.reply_text(HELP_TEXT, parse_mode="MarkdownV2")


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command."""
    if update.effective_user.id != settings.telegram_allowed_user_id:
        return
    await update.message.reply_text(
        r"שלום\! 👋 אני בוטי, עוזר ניהול הרכש שלך\." "\n"
        r"שלחי /help כדי לראות את כל מה שאני יכול לעשות\.",
        parse_mode="MarkdownV2",
    )


def _trim_history(history: list, max_chars: int = MAX_HISTORY_TOKENS_ESTIMATE * 4) -> list:
    """Trim history from the front to stay within approximate token budget."""
    total = sum(len(m.content) for m in history)
    while total > max_chars and len(history) >= 2:
        removed = history.pop(0)
        total -= len(removed.content)
        # Always remove in pairs (human + ai) to keep conversation coherent
        if history and isinstance(history[0], AIMessage):
            removed2 = history.pop(0)
            total -= len(removed2.content)
    return history


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming Telegram messages."""
    if update.effective_user.id != settings.telegram_allowed_user_id:
        logger.warning("unauthorized_user", user_id=update.effective_user.id)
        return

    user_message = update.message.text
    logger.info("message_received", text=user_message[:100])

    # Send typing indicator while processing
    await update.message.chat.send_action("typing")

    # Retrieve conversation history from context (in-memory, per user)
    if "history" not in context.user_data:
        context.user_data["history"] = []
    history: list = context.user_data["history"]

    async with async_session() as session:
        try:
            response = await run_agent(session, user_message, history=history)

            # Append this exchange as proper message objects
            history.append(HumanMessage(content=user_message))
            history.append(AIMessage(content=response))

            # Trim to keep context window manageable
            _trim_history(history)

            html_response = _markdown_to_html(response)
            await update.message.reply_text(html_response, parse_mode="HTML")
            logger.info("response_sent", length=len(response))
        except Exception as e:
            logger.error("agent_error", error=str(e))
            await update.message.reply_text("שגיאה בעיבוד ההודעה. נסי שוב.")


def create_bot_application() -> Application:
    """Create the Telegram bot application."""
    return (
        Application.builder()
        .token(settings.telegram_bot_token)
        .build()
    )


async def start_bot() -> Application:
    """Initialize and start the Telegram bot polling."""
    application = create_bot_application()
    application.add_handler(CommandHandler("help", handle_help))
    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    await application.initialize()
    await application.start()
    await application.updater.start_polling(drop_pending_updates=True)
    logger.info("bot_started")
    return application


async def stop_bot(application: Application) -> None:
    """Stop the Telegram bot."""
    await application.updater.stop()
    await application.stop()
    await application.shutdown()
    logger.info("bot_stopped")
