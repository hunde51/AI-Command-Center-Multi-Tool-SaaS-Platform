from __future__ import annotations


def pagination_meta(*, page: int, limit: int, total: int) -> dict[str, int | bool]:
    total_pages = (total + limit - 1) // limit if total > 0 else 0
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1 and total_pages > 0,
    }
