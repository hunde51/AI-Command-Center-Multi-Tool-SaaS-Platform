from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user
from app.models.user import User
from app.utils.response_wrapper import api_response

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def user_dashboard(current_user: User = Depends(get_current_active_user)) -> dict:
    return api_response(
        True,
        "Dashboard fetched successfully",
        {"user_id": str(current_user.id), "role": current_user.role.value},
    )
