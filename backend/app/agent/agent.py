import structlog
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.agent.callbacks import StructlogCallbackHandler
from app.agent.prompts import get_system_prompt
from app.agent.tools import get_agent_tools

logger = structlog.get_logger("agent")

# Reuse a single LLM client across calls
_llm = ChatOpenAI(
    model=settings.openai_model,
    api_key=settings.openai_api_key,
    timeout=settings.openai_timeout,
    max_retries=settings.openai_max_retries,
    callbacks=[StructlogCallbackHandler()],
)


async def run_agent(session: AsyncSession, user_message: str, history: list = None) -> str:
    """Run the LangChain agent with the given user message and return the response."""
    tools = get_agent_tools(session)
    tool_map = {t.name: t for t in tools}
    llm_with_tools = _llm.bind_tools(tools)

    messages = [SystemMessage(content=get_system_prompt())]
    if history:
        messages.extend(history)
    messages.append(HumanMessage(content=user_message))

    for _ in range(settings.agent_max_iterations):
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)

        if not response.tool_calls:
            return response.content

        for tool_call in response.tool_calls:
            tool_fn = tool_map.get(tool_call["name"])
            if not tool_fn:
                logger.warning("unknown_tool_call", tool_name=tool_call["name"])
                messages.append(ToolMessage(
                    content=f"Error: tool '{tool_call['name']}' not found",
                    tool_call_id=tool_call["id"],
                ))
                continue

            try:
                tool_result = await tool_fn.ainvoke(tool_call["args"])
            except Exception as e:
                logger.error("tool_execution_error", tool_name=tool_call["name"], error=str(e))
                tool_result = f"Error executing tool: {e}"

            messages.append(ToolMessage(
                content=str(tool_result),
                tool_call_id=tool_call["id"],
            ))

    logger.error("agent_max_iterations", iterations=settings.agent_max_iterations)
    return "סליחה, לא הצלחתי לסיים את הפעולה. נסי שוב."
