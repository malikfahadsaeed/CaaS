"""Chat request/response schemas."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming chat message from the client."""

    message: str = Field(..., min_length=1, max_length=4000, description="The user's message")


class ChatResponse(BaseModel):
    """The assistant's reply."""

    reply: str
