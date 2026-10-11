"""
NEXUS Structured Logger
Provides formatted structured logging with request, trace, and operational context.
"""
import logging
import sys
from typing import Any, Dict


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("nexus")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()
