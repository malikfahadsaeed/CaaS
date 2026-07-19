"""Logging configuration."""

import logging
import sys


def configure_logging(log_level: str = "INFO") -> None:
    """Configure root logging to stdout with a consistent format."""
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
        force=True,
    )
