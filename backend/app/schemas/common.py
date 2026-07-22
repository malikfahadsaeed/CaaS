"""Shared response schemas ensuring a consistent API response shape."""

from pydantic import BaseModel


class ResponseEnvelope[T](BaseModel):
    """Consistent envelope wrapping every API response.

    - `success`: whether the request succeeded.
    - `data`: the payload on success (typed per endpoint).
    - `error`: a human-readable message on failure.
    """

    success: bool
    data: T | None = None
    error: str | None = None
