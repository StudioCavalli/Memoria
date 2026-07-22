from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Shared limiter. Disabled in tests (settings.rate_limit_enabled=False) so the
# suite can register/login repeatedly without tripping the in-memory counters.
limiter = Limiter(key_func=get_remote_address, enabled=settings.rate_limit_enabled)
