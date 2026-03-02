from fastapi import Request


async def rate_limit_placeholder(_: Request) -> None:
    """Placeholder for future Redis-backed/IP-user aware rate limiting."""
    return None
