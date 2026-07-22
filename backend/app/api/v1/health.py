"""Health check route."""

from fastapi import APIRouter

from app.core.constants import HEALTH_STATUS_OK
from app.schemas.common import ResponseEnvelope
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=ResponseEnvelope[HealthResponse])
async def health() -> ResponseEnvelope[HealthResponse]:
    """Return service health status."""
    return ResponseEnvelope(success=True, data=HealthResponse(status=HEALTH_STATUS_OK))
