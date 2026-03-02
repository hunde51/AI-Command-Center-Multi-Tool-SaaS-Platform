from fastapi import APIRouter, Depends

from app.api.deps import require_admin
from app.models.user import User
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def admin_dashboard(current_user: User = Depends(require_admin)) -> dict:
    return api_response(
        True,
        "Admin dashboard fetched successfully",
        {"user_id": str(current_user.id), "role": current_user.role.value},
    )
