"""Health check schema."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Service health status."""

    status: str
