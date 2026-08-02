"""Chat service — the seam where the LLM integration lives.

Generates assistant replies via Amazon Bedrock's `converse` API. The client
supplies prior turns (`history`), so the assistant has conversational context
without any server-side persistence. On any Bedrock error the service logs and
returns a friendly fallback so the API's response envelope stays consistent.
"""

import logging

import aioboto3

from app.core.config import Settings, get_settings
from app.core.constants import ASSISTANT_FALLBACK
from app.schemas.chat import ChatTurn

logger = logging.getLogger(__name__)

# A single shared session; aioboto3 creates a fresh client per request via the
# async context manager below. The session is cheap and safe to reuse.
_session = aioboto3.Session()


class ChatService:
    """Generates assistant replies using Amazon Bedrock."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def generate_reply(self, message: str, history: list[ChatTurn] | None = None) -> str:
        """Return the assistant's reply for a user message and prior turns."""
        messages = self._build_messages(message, history or [])
        try:
            async with _session.client(
                "bedrock-runtime", region_name=self._settings.bedrock_region
            ) as client:
                response = await client.converse(
                    modelId=self._settings.bedrock_model_id,
                    system=[{"text": self._settings.system_prompt}],
                    messages=messages,
                    inferenceConfig={"maxTokens": self._settings.bedrock_max_tokens},
                )
            return self._extract_text(response)
        except Exception:
            logger.exception("Bedrock converse call failed")
            return ASSISTANT_FALLBACK

    @staticmethod
    def _build_messages(message: str, history: list[ChatTurn]) -> list[dict[str, object]]:
        """Map prior turns plus the new message into the Bedrock message list."""
        messages: list[dict[str, object]] = [
            {"role": turn.role, "content": [{"text": turn.content}]} for turn in history
        ]
        messages.append({"role": "user", "content": [{"text": message}]})
        return messages

    @staticmethod
    def _extract_text(response: dict[str, object]) -> str:
        """Pull the assistant's text out of a Bedrock `converse` response."""
        output = response.get("output", {})
        message = output.get("message", {}) if isinstance(output, dict) else {}
        content = message.get("content", []) if isinstance(message, dict) else []
        parts = [
            block["text"]
            for block in content
            if isinstance(block, dict) and isinstance(block.get("text"), str)
        ]
        text = "".join(parts).strip()
        return text or ASSISTANT_FALLBACK


def get_chat_service() -> ChatService:
    """FastAPI dependency provider for the chat service."""
    return ChatService(get_settings())
