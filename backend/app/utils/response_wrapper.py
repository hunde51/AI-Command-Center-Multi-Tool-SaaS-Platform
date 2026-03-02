from typing import Any


def api_response(success: bool, message: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "success": success,
        "message": message,
        "data": data or {},
    }
