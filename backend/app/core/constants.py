"""Application-wide constant strings. No hardcoded literals elsewhere."""

# The default assistant greeting. Milestone 1 returned this for every request;
# from Milestone 2 the chat service calls Bedrock, but this remains a safe
# default (e.g. for the empty state) and documents the assistant's persona.
ASSISTANT_GREETING = "Hi, I'm your AI assistant. How may I help you?"

# Shown to the user when the Bedrock call fails, so the response envelope stays
# consistent and the UI degrades gracefully instead of surfacing a raw error.
ASSISTANT_FALLBACK = "Sorry, I'm having trouble responding right now. Please try again."

# Default system prompt steering the assistant's behaviour. Overridable via the
# SYSTEM_PROMPT environment variable (see app/core/config.py).
DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful, concise AI assistant for a chat application. "
    "Answer clearly and stay on topic."
)

# API routing.
API_V1_PREFIX = "/api/v1"

# Health check status value.
HEALTH_STATUS_OK = "healthy"
