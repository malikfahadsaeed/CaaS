"""Aggregates all v1 routers under a single APIRouter."""

from fastapi import APIRouter

from app.api.v1 import chat, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(chat.router, tags=["chat"])
