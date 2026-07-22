"""Chat service — the single seam where a real LLM integration plugs in later.

For Milestone 1 this returns a static greeting. Because routes depend on this
service (not on the implementation), swapping in an LLM later requires no route
changes.
"""

from app.core.constants import ASSISTANT_GREETING


class ChatService:
    """Generates assistant replies."""

    async def generate_reply(self, message: str) -> str:
        """Return the assistant's reply for a given user message.

        Milestone 1: always returns the static greeting regardless of input.
        """
        return ASSISTANT_GREETING


def get_chat_service() -> ChatService:
    """FastAPI dependency provider for the chat service."""
    return ChatService()
