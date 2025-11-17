"""Logging helpers: deduplication filter to reduce repeated log noise.

This module provides a LoggingDedupFilter which suppresses identical
log records that occur within a short timeframe (window seconds).

Usage: attach filter to the root logger in `server/app.py`:
    from utils.logging_helpers import LoggingDedupFilter
    root_logger.addFilter(LoggingDedupFilter(window_seconds=5))

Configuration via env var `LOG_DEDUP_SECONDS` (default 5).
"""
from __future__ import annotations

import time
import logging
import threading
from typing import Dict


class LoggingDedupFilter(logging.Filter):
    """Suppress identical log messages that recur within window_seconds.

    The filter key is built from (levelno, name, pathname, lineno, msg).
    Identical records within the window are suppressed (return False).
    """

    def __init__(self, name: str | None = None, window_seconds: int = 5):
        # logging.Filter expects a string name ('' for root); ensure we pass a string
        super().__init__(name or "")
        self.window_seconds = float(window_seconds)
        self._last_seen: Dict[str, float] = {}
        self._lock = threading.Lock()

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            key = f"{record.levelno}:{record.name}:{record.pathname}:{record.lineno}:{record.getMessage()}"
        except Exception:
            # If building key fails, allow the record through
            return True

        now = time.time()
        with self._lock:
            last = self._last_seen.get(key)
            if last is None or (now - last) >= self.window_seconds:
                # update last seen and allow
                self._last_seen[key] = now
                return True
            # suppressed
            return False
