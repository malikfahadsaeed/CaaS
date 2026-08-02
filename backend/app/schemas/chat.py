"""Chat request/response schemas."""

from typing import Literal

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    """A single prior turn in the conversation.

    History is supplied by the client (the SPA holds it in state), which gives
    the assistant conversational context without any server-side persistence.
    """

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    """Incoming chat message from the client."""

    message: str = Field(..., min_length=1, max_length=4000, description="The user's message")
    history: list[ChatTurn] = Field(
        default_factory=list,
        description="Prior conversation turns, oldest first, for assistant context.",
    )


class ChatResponse(BaseModel):
    """The assistant's reply."""

    reply: str
