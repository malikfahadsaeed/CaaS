"""Application-wide constant strings. No hardcoded literals elsewhere."""

# The static assistant reply for Milestone 1. This is the single seam that a
# real LLM response will replace later (see app/services/chat_service.py).
ASSISTANT_GREETING = "Hi, I'm your AI assistant. How may I help you?"

# API routing.
API_V1_PREFIX = "/api/v1"

# Health check status value.
HEALTH_STATUS_OK = "healthy"
