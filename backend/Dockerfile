# syntax=docker/dockerfile:1

# --- Builder: resolve and install dependencies into a venv ---
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install runtime dependencies only (no dev deps, no project package).
COPY pyproject.toml ./
RUN uv sync --no-dev

# --- Runtime: slim final image ---
FROM python:3.12-slim AS runtime

WORKDIR /app

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser

# Copy the resolved virtual environment and application code.
COPY --from=builder /app/.venv /app/.venv
COPY app ./app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER appuser
EXPOSE 8090

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
