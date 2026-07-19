"""Tests for the chat endpoint."""

from httpx import AsyncClient

from app.core.constants import ASSISTANT_GREETING


async def test_chat_returns_greeting(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={"message": "hello"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["reply"] == ASSISTANT_GREETING
    assert body["error"] is None


async def test_chat_returns_greeting_for_any_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={"message": "what is the weather?"})

    assert resp.status_code == 200
    assert resp.json()["data"]["reply"] == ASSISTANT_GREETING


async def test_chat_rejects_empty_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={"message": ""})

    assert resp.status_code == 422


async def test_chat_rejects_missing_message(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/chat", json={})

    assert resp.status_code == 422
