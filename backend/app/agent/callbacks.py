import structlog
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from typing import Any

logger = structlog.get_logger("agent")


class StructlogCallbackHandler(BaseCallbackHandler):
    """Logs every LangChain agent decision in structured JSON via structlog."""

    def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs: Any) -> None:
        logger.info("llm_start", model=serialized.get("id", ["unknown"])[-1])

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        generation = response.generations[0][0]
        tool_calls = []
        if hasattr(generation, "message") and hasattr(generation.message, "tool_calls"):
            tool_calls = [
                {"name": tc["name"], "args": tc["args"]}
                for tc in generation.message.tool_calls
            ]

        # Track token usage
        token_usage = {}
        if response.llm_output:
            token_usage = response.llm_output.get("token_usage", {})

        logger.info(
            "llm_end",
            tool_calls=tool_calls if tool_calls else "none",
            content_preview=str(generation.text)[:200] if generation.text else "",
            prompt_tokens=token_usage.get("prompt_tokens"),
            completion_tokens=token_usage.get("completion_tokens"),
            total_tokens=token_usage.get("total_tokens"),
        )

    def on_tool_start(self, serialized: dict, input_str: str, **kwargs: Any) -> None:
        logger.info("tool_start", tool=serialized.get("name", "unknown"), input=input_str[:500])

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        logger.info("tool_end", output=str(output)[:500])

    def on_tool_error(self, error: BaseException, **kwargs: Any) -> None:
        logger.error("tool_error", error=str(error))

    def on_chain_error(self, error: BaseException, **kwargs: Any) -> None:
        logger.error("chain_error", error=str(error))
