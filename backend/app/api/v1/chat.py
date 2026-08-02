"""Chat route. Thin — all logic lives in the chat service."""

from fastapi import APIRouter, Depends

from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.common import ResponseEnvelope
from app.services.chat_service import ChatService, get_chat_service

router = APIRouter()


@router.post("/chat", response_model=ResponseEnvelope[ChatResponse])
async def chat(
    payload: ChatRequest,
    service: ChatService = Depends(get_chat_service),
) -> ResponseEnvelope[ChatResponse]:
    """Return the assistant's reply for the given message."""
    reply = await service.generate_reply(payload.message, payload.history)
    return ResponseEnvelope(success=True, data=ChatResponse(reply=reply))
