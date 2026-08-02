"""Unit tests for the Bedrock-backed chat service.

The Bedrock client is faked so no AWS call is made; we verify message shaping,
response extraction, and the error fallback.
"""

from typing import Any

import pytest

from app.core.config import get_settings
from app.core.constants import ASSISTANT_FALLBACK
from app.schemas.chat import ChatTurn
from app.services import chat_service
from app.services.chat_service import ChatService


class _FakeClient:
    """Async-context-manager stand-in for a bedrock-runtime client."""

    def __init__(self, response: dict[str, Any] | None = None, error: Exception | None = None):
        self._response = response or {}
        self._error = error
        self.calls: list[dict[str, Any]] = []

    async def __aenter__(self) -> "_FakeClient":
        return self

    async def __aexit__(self, *_: object) -> bool:
        return False

    async def converse(self, **kwargs: Any) -> dict[str, Any]:
        self.calls.append(kwargs)
        if self._error is not None:
            raise self._error
        return self._response


class _FakeSession:
    def __init__(self, client: _FakeClient) -> None:
        self._client = client

    def client(self, *_: object, **__: object) -> _FakeClient:
        return self._client


def _service() -> ChatService:
    return ChatService(get_settings())


def test_build_messages_appends_current_after_history() -> None:
    turns = [ChatTurn(role="user", content="hi"), ChatTurn(role="assistant", content="hello")]

    messages = ChatService._build_messages("how are you?", turns)

    assert messages == [
        {"role": "user", "content": [{"text": "hi"}]},
        {"role": "assistant", "content": [{"text": "hello"}]},
        {"role": "user", "content": [{"text": "how are you?"}]},
    ]


def test_extract_text_joins_text_blocks() -> None:
    response = {"output": {"message": {"content": [{"text": "Hello"}, {"text": " world"}]}}}

    assert ChatService._extract_text(response) == "Hello world"


def test_extract_text_falls_back_when_empty() -> None:
    assert ChatService._extract_text({"output": {"message": {"content": []}}}) == ASSISTANT_FALLBACK


async def test_generate_reply_returns_model_text(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeClient(response={"output": {"message": {"content": [{"text": "42"}]}}})
    monkeypatch.setattr(chat_service, "_session", _FakeSession(fake))

    reply = await _service().generate_reply("q", [ChatTurn(role="user", content="prev")])

    assert reply == "42"
    # The current message is forwarded to Bedrock after any history.
    assert fake.calls[0]["messages"][-1] == {"role": "user", "content": [{"text": "q"}]}


async def test_generate_reply_falls_back_on_error(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeClient(error=RuntimeError("bedrock unavailable"))
    monkeypatch.setattr(chat_service, "_session", _FakeSession(fake))

    reply = await _service().generate_reply("q")

    assert reply == ASSISTANT_FALLBACK
