"""FastAPI application entry point."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.schemas.common import ResponseEnvelope

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Application factory: build and configure the FastAPI app."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Return a consistent error envelope for any unhandled exception."""
        logger.exception("Unhandled error processing %s %s", request.method, request.url.path)
        envelope: ResponseEnvelope[None] = ResponseEnvelope(
            success=False, error="Internal server error"
        )
        return JSONResponse(status_code=500, content=envelope.model_dump())

    return app


app = create_app()
