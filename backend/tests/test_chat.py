"""Tests for the chat endpoint.

The endpoint is tested against a stubbed chat service (via FastAPI dependency
override) so no Bedrock/network call is made. Bedrock logic itself is unit
tested in `test_chat_service.py`.
"""

from collections.abc import Iterator

import pytest
from httpx import AsyncClient

from app.main import app
from app.schemas.chat import ChatTurn
from app.services.chat_service import get_chat_service


class _StubService:
    """Records what the route passes in and returns a canned reply."""

    def __init__(self, reply: str = "stub reply") -> None:
        self.reply = reply
        self.received: list[tuple[str, list[ChatTurn] | None]] = []

    async def generate_reply(self, message: str, history: list[ChatTurn] | None = None) -> str:
        self.received.append((message, history))
        return self.reply


@pytest.fixture
def stub_service() -> Iterator[_StubService]:
    stub = _StubService()
    app.dependency_overrides[get_chat_service] = lambda: stub
    yield stub
    app.dependency_overrides.pop(get_chat_service, None)


async def test_chat_returns_reply(client: AsyncClient, stub_service: _StubService) -> None:
    resp = await client.post("/api/v1/chat", json={"message": "hello"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["reply"] == "stub reply"
    assert body["error"] is None


async def test_chat_forwards_history(client: AsyncClient, stub_service: _StubService) -> None:
    payload = {
        "message": "and then?",
        "history": [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello"},
        ],
    }
    resp = await client.post("/api/v1/chat", json=payload)

    assert resp.status_code == 200
    message, history = stub_service.received[-1]
    assert message == "and then?"
    assert history is not None
    assert [turn.role for turn in history] == ["user", "assistant"]


async def test_chat_defaults_history_to_empty(
    client: AsyncClient, stub_service: _StubService
) -> None:
    await client.post("/api/v1/chat", json={"message": "hello"})

    _, history = stub_service.received[-1]
    assert history == []


async def test_chat_rejects_empty_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={"message": ""})

    assert resp.status_code == 422


async def test_chat_rejects_missing_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={})

    assert resp.status_code == 422


async def test_chat_rejects_invalid_history_role(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/chat",
        json={"message": "hi", "history": [{"role": "system", "content": "x"}]},
    )

    assert resp.status_code == 422
